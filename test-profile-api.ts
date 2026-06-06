import { POST } from './app/api/profiles/route';

async function test() {
  const req = new Request('http://localhost/api/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "Test1",
      price: "100",
      type: "data"
    })
  });
  
  const res = await POST(req);
  console.log(await res.json());
}
test();
