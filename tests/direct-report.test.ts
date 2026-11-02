import assert from 'node:assert/strict';
import { getDirectReport } from '../src/lib/direct-report';
async function main() {
 let seen: {url: string; init?: RequestInit} | undefined;
 const mock = (async (input: string | URL | Request, init?: RequestInit) => { seen = {url: String(input), init}; return new Response('CampaignId\tImpressions\tClicks\tCost\tConversions\n123\t100\t12\t12.34\t2\n', {status: 200}); }) as typeof fetch;
 assert.deepEqual(await getDirectReport('123','test-token','agency-client',mock), {state:'ready', impressions:100,clicks:12,cost:12.34,conversions:2});
 assert.equal(seen?.url, 'https://api.direct.yandex.com/json/v501/reports');
 const headers = seen?.init?.headers as Record<string,string>;assert.equal(headers['Client-Login'],'agency-client');assert.equal(headers.returnMoneyInMicros,'false');
 const payload=JSON.parse(String(seen?.init?.body));assert.deepEqual(payload.params.SelectionCriteria.Filter[0].Values,['123']);
 const pending=(async()=>new Response('',{status:202})) as typeof fetch;assert.deepEqual(await getDirectReport('123','token','',pending),{state:'pending'});
 const empty=(async()=>new Response('CampaignId\tImpressions\tClicks\tCost\tConversions\n',{status:200})) as typeof fetch;assert.deepEqual(await getDirectReport('123','token','',empty),{state:'empty'});
 const broken=(async()=>new Response('secret test-token', {status:403})) as typeof fetch;await assert.rejects(()=>getDirectReport('123','test-token','',broken), e=>e instanceof Error && !e.message.includes('test-token'));
 const invalid=(async()=>new Response('CampaignId\tImpressions\tClicks\tCost\tConversions\n999\t10\t1\t2\t3\n',{status:200})) as typeof fetch;await assert.rejects(()=>getDirectReport('123','token','',invalid));
 await assert.rejects(()=>getDirectReport('x','token','',mock));
 console.log('Direct report mock tests: 6 passed');
}
main().catch(e=>{console.error(e);process.exit(1)});
