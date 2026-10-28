import os
import sys
import json
import unittest
from unittest.mock import patch
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
import handler

class TestScoring(unittest.TestCase):
    def test_perfect_score_for_all_six(self):
        for key, steps in handler.SCENARIOS.items():
            with self.subTest(key=key):
                self.assertEqual(handler.verify_transcript(key, [s[0] for s in steps]), 100)

    def test_penalties_are_recomputed(self):
        seq = ['help', 'tail -n 20 error.log','hint','docker ps','wrong action','fix upstream','curl /health']
        self.assertEqual(handler.verify_transcript('upstream',seq), 87)

    def test_sensible_diagnostic_not_penalized(self):
        sequence=['tail -n 20 error.log', 'docker ps', 'docker start api',
                  'docker logs api', 'fix upstream', 'curl /health']
        self.assertEqual(handler.verify_transcript('upstream', sequence),100)

    def test_iam_least_privilege_scenario(self):
        self.assertIn('iam',handler.SCENARIOS)
        cmds=[s[0] for s in handler.SCENARIOS['iam']]
        self.assertEqual(handler.verify_transcript('iam',cmds),100)

    def test_early_submit_blocked(self):
        with self.assertRaises(ValueError):
            handler.verify_transcript('disk', ['df -h']*4)

    def test_invalid_commands_rejected(self):
        with self.assertRaises(ValueError):
            handler.verify_transcript('env', ['a'*111]*4)

    def test_score_not_taken_from_request(self):
        seq=['pipeline status','pipeline logs','fix credentials','pipeline rerun']
        event={'routeKey':'POST /leaderboard','body':json.dumps({'name':'cloud_wizard','incidentId':'pipeline','commands':seq,'score':9999})}
        with patch.object(handler.DDB,'put_item') as mocked:
            result=handler.lambda_handler(event,None)
            self.assertEqual(result['statusCode'],201)
            self.assertEqual(json.loads(result['body'])['score'],100)
            self.assertEqual(mocked.call_args.kwargs['Item']['score']['N'],'100')

    def test_reject_bad_name(self):
        event={'routeKey':'POST /leaderboard','body':json.dumps({'name':'<script>alert(1)</script>','incidentId':'disk','commands':['df -h','docker system df','fix logs','curl /health']})}
        self.assertEqual(handler.lambda_handler(event,None)['statusCode'],400)

    def test_free_portfolio_commands_do_not_penalize(self):
        seq=['about','skills','projects','contact','resume','certs','sudo hire kashfa','tail -n 20 error.log','docker ps','fix upstream','curl /health']
        self.assertEqual(handler.verify_transcript('upstream',seq),100)

    def test_profanity_name_rejected(self):
        seq=['df -h','docker system df','fix logs','curl /health']
        event={'routeKey':'POST /leaderboard','body':json.dumps({'name':'bad shit','incidentId':'disk','commands':seq})}
        self.assertEqual(handler.lambda_handler(event,None)['statusCode'],400)

    def test_non_profanity_substring_allowed(self):
        seq=['df -h','docker system df','fix logs','curl /health']
        event={'routeKey':'POST /leaderboard','body':json.dumps({'name':'classy coder','incidentId':'disk','commands':seq})}
        with patch.object(handler.DDB,'put_item'):
            self.assertEqual(handler.lambda_handler(event,None)['statusCode'],201)

    def test_unsupported_route(self):
        self.assertEqual(handler.lambda_handler({'routeKey':'POST /unknown'},None)['statusCode'],404)

if __name__=='__main__':unittest.main()
