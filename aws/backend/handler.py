"""Incident Zero AWS backend. Public routes, no user AWS credentials in client code.

Security model: validate all data, recompute score from a bounded command trace,
limit DynamoDB capacity, and configure API throttling. This is not an identity-
verified anti-cheat system; anonymous clients can fabricate command traces.
"""
import base64
import datetime as dt
import json
import os
import re
import uuid

import boto3

TABLE = os.environ.get('TABLE_NAME', 'incident-zero-leaderboard')
DDB = boto3.client('dynamodb')
NAME_RE = re.compile(r'^[a-zA-Z0-9 _.-]{2,24}$')
FREE_COMMANDS = {'help', 'clear', 'whoami', 'architecture', 'about', 'skills', 'projects', 'contact', 'resume', 'certs', 'sudo hire kashfa'}
BLOCKED_WORDS = {'fuck', 'shit', 'bitch', 'asshole'}
SCENARIOS = {
    'upstream': [
        ['tail -n 20 error.log', 'tail -n 20 /var/log/nginx/error.log'],
        ['docker ps', 'docker ps -a'],
        ['fix upstream'],
        ['curl /health'],
    ],
    'disk': [
        ['df -h'],
        ['du -sh /var/log/*', 'docker system df'],
        ['fix logs'],
        ['curl /health'],
    ],
    'ssl': [
        ['curl -iv https://app', 'curl -iv https://example.test'],
        ['systemctl status certbot.timer', 'openssl s_client -connect app:443'],
        ['fix certificate'],
        ['curl /health'],
    ],
    'env': [
        ['docker ps', 'docker ps -a', 'systemctl status api'],
        ['docker logs api'],
        ['fix env'],
        ['curl /health'],
    ],
    'iam': [
        ['aws sts get-caller-identity'],
        ['aws s3api head-object --bucket demo-assets --key build.json'],
        ['fix iam'],
        ['verify iam'],
    ],
    'pipeline': [
        ['pipeline status'],
        ['pipeline logs'],
        ['fix credentials'],
        ['pipeline rerun'],
    ],
}


# Recognized diagnostic commands may not advance the current checkpoint,
# but they're still valid investigation attempts, not harmful decisions.
NEUTRAL_COMMANDS = {
    option for sequence in SCENARIOS.values() for step in sequence[:2] for option in step
} | {'docker start api'}


def normalize(command):
    return ' '.join(command.strip().lower().split())


def verify_transcript(incident_id, commands):
    """Derive a bounded score only if the transcript completes the incident."""
    if incident_id not in SCENARIOS:
        raise ValueError('Unknown incident')
    if not isinstance(commands, list) or not 4 <= len(commands) <= 45:
        raise ValueError('Command trace must contain 4–45 commands')
    stage = 0
    errors = 0
    hints = set()
    for original in commands:
        if not isinstance(original, str) or not 1 <= len(original) <= 110:
            raise ValueError('Invalid command')
        command = normalize(original)
        if stage == 4:
            break
        if command == 'hint':
            hints.add(stage)
        elif command in FREE_COMMANDS:
            continue
        elif command in SCENARIOS[incident_id][stage]:
            stage += 1
        elif command in NEUTRAL_COMMANDS:
            continue
        else:
            errors += 1
    if stage != 4:
        raise ValueError('Incident has not been resolved')
    return max(0, 100 - errors * 8 - len(hints) * 5)


def response(status, data):
    return {
        'statusCode': status,
        'headers': {'content-type': 'application/json', 'cache-control': 'no-store',
                    'x-content-type-options': 'nosniff'},
        'body': json.dumps(data, separators=(',', ':')),
    }


def parse_body(event):
    body = event.get('body') or ''
    if event.get('isBase64Encoded'):
        body = base64.b64decode(body).decode('utf-8')
    if not isinstance(body, str) or len(body.encode('utf-8')) > 6000:
        raise ValueError('Request body exceeds limit')
    try:
        obj = json.loads(body)
    except (json.JSONDecodeError, ValueError) as exc:
        raise ValueError('Invalid JSON') from exc
    if not isinstance(obj, dict):
        raise ValueError('Expected a JSON object')
    return obj


def rank_of(score):
    return 'S' if score >= 95 else 'A' if score >= 85 else 'B' if score >= 70 else 'C' if score >= 50 else 'D'


def submit(event):
    obj = parse_body(event)
    name = obj.get('name')
    incident_id = obj.get('incidentId')
    if not isinstance(name, str) or not NAME_RE.fullmatch(name.strip()):
        raise ValueError('Name must be 2–24 letters, numbers, spaces, dots, underscores or dashes')
    name = name.strip()
    if any(word in BLOCKED_WORDS for word in re.findall(r'[a-z]+', name.lower())):
        raise ValueError('Please choose another callsign')
    commands = obj.get('commands')
    score = verify_transcript(incident_id, commands)
    now = dt.datetime.now(dt.timezone.utc)
    timestamp = now.strftime('%Y%m%dT%H%M%S%fZ')
    sort_key = f'SCORE#{score:03d}#{timestamp}#{uuid.uuid4().hex[:12]}'
    expires = int(now.timestamp()) + 90 * 24 * 3600
    DDB.put_item(
        TableName=TABLE,
        Item={
            'pk': {'S': 'BOARD'}, 'sk': {'S': sort_key},
            'name': {'S': name}, 'score': {'N': str(score)},
            'incident': {'S': incident_id}, 'expiresAt': {'N': str(expires)}
        },
        ConditionExpression='attribute_not_exists(pk) AND attribute_not_exists(sk)',
    )
    return response(201, {'saved': True, 'score': score, 'rank': rank_of(score)})


def leaderboard():
    # One partition + score-prefixed sort key; descending Query, not table Scan.
    result = DDB.query(
        TableName=TABLE,
        KeyConditionExpression='pk = :partition',
        ExpressionAttributeValues={':partition': {'S': 'BOARD'}},
        ScanIndexForward=False,
        Limit=25,  # Over-fetch a little to discard TTL-expired items before deletion.
    )
    now = int(dt.datetime.now(dt.timezone.utc).timestamp())
    scores = []
    for item in result.get('Items', []):
        if int(item.get('expiresAt', {}).get('N', '0')) <= now:
            continue
        scores.append({'name': item['name']['S'], 'score': int(item['score']['N'])})
        if len(scores) == 10:
            break
    return response(200, {'scores': scores})


def status():
    item = DDB.get_item(TableName=TABLE, Key={'pk': {'S': 'METRIC'}, 'sk': {'S': 'VISITS'}}).get('Item', {})
    count = int(item.get('count', {}).get('N', '0'))
    return response(200, {'online': True, 'sessionPings': count})


def visits():
    DDB.update_item(TableName=TABLE,
                    Key={'pk': {'S': 'METRIC'}, 'sk': {'S': 'VISITS'}},
                    UpdateExpression='ADD #count :one',
                    ExpressionAttributeNames={'#count': 'count'},
                    ExpressionAttributeValues={':one': {'N': '1'}})
    return response(200, {'ok': True})


def lambda_handler(event, _context):
    route = event.get('routeKey', '')
    try:
        if route == 'GET /leaderboard':
            return leaderboard()
        if route == 'POST /leaderboard':
            return submit(event)
        if route == 'GET /status':
            return status()
        if route == 'POST /visits':
            return visits()
        return response(404, {'error': 'Route not found'})
    except ValueError as exc:
        return response(400, {'error': str(exc)})
    except Exception:
        # Do not leak internal AWS errors to public clients.
        return response(503, {'error': 'Leaderboard temporarily unavailable'})
