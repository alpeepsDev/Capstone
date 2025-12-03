import axios from "axios";

async function testRateLimiter() {
  const url = "http://localhost:3001/api/v1/users/login";
  const request = [];

  for (let i = 0; i < 50; i++) {
    request.push(
      axios
        .post(url, {
          email: "user1@example.com",
          password: "Password123!",
        })
        .then(
          (res) => console.log(`Request ${i}: ${res.status}`),
          (err) => console.log(`Request ${i}: ${err.response?.status}`)
        )
    );
  }

  await Promise.all(request);
}

testRateLimiter();
