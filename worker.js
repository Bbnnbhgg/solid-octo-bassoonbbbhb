
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const TARGET_URL = 'https://wearedevs.net/api/obfuscate';

// Fetch the token from Pastefy
async function fetchToken() {
  const tokenUrl = 'https://pastefy.app/zgzcRM4n/raw'; // Token URL
  try {
    const response = await fetch(tokenUrl);
    if (response.ok) {
      const token = await response.text();
      console.log('Fetched Token:', token);
      return token.trim();
    } else {
      throw new Error('Failed to fetch token');
    }
  } catch (error) {
    console.error('Error fetching token:', error);
    return null;
  }
}

// GitHub details
const GITHUB_REPO = 'Bbnnbhgg/solid-octo-bassoonbbbhb';
const GITHUB_BRANCH = 'main';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/`;

// Token cache
let cachedToken = null;
async function getGithubToken() {
  if (cachedToken) return cachedToken;
  cachedToken = await fetchToken();
  return cachedToken;
}

// Main handler
async function handleRequest(event) {
  const request = event.request;
  const url = new URL(request.url);

  if (url.pathname === "/") {
    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (url.pathname === "/obfuscate" && request.method === "POST") {
    const body = await request.json();
    const inputScript = body.script;

    if (!inputScript) {
      return new Response(JSON.stringify({ error: "No script provided" }), { status: 400 });
    }

    try {
      const response = await fetch(CORS_PROXY + TARGET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: inputScript }),
      });

      const responseText = await response.text();
      console.log('Obfuscation API Response:', responseText);

      if (!response.ok) {
        console.error(`Obfuscation API request failed with status: ${response.status}`);
        return new Response(JSON.stringify({ error: `Obfuscation API request failed with status: ${response.status}`, details: responseText }), { status: response.status });
      }

      const data = JSON.parse(responseText);

      if (data && data.obfuscated) {
        const fileName = `obfuscated_${crypto.randomUUID()}.js`;
        const uploadUrl = await uploadToGitHub(fileName, data.obfuscated);

        return new Response(JSON.stringify({ obfuscated: data.obfuscated, githubUrl: uploadUrl }), {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        console.error('Unexpected response format:', data);
        return new Response(JSON.stringify({ error: "Unexpected response format" }), { status: 500 });
      }
    } catch (error) {
      console.error('Error during obfuscation process:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
}

// Upload to GitHub
async function uploadToGitHub(fileName, fileContent) {
  const githubToken = await getGithubToken();
  const contentBase64 = btoa(fileContent);
  const commitMessage = "Upload obfuscated script";

  const body = JSON.stringify({
    message: commitMessage,
    content: contentBase64,
    branch: GITHUB_BRANCH,
  });

  const response = await fetch(GITHUB_API_URL + fileName, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `token ${githubToken}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload to GitHub: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content.html_url;
}

// HTML Content (upgraded)
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Script Obfuscator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background: #121212;
      color: #f0f0f0;
    }
    textarea {
      width: 100%;
      height: 150px;
      margin-top: 10px;
      background: #1e1e1e;
      color: #f0f0f0;
      border: 1px solid #333;
      padding: 10px;
      font-family: monospace;
    }
    button {
      margin-top: 10px;
      padding: 10px 20px;
      background: #4CAF50;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      border-radius: 5px;
    }
    button:hover {
      background: #45a049;
    }
    .spinner {
      display: none;
      margin-top: 20px;
    }
    #linkSection {
      margin-top: 20px;
    }
    #linkButton {
      display: none;
      margin-top: 10px;
      background: #2196F3;
    }
  </style>
</head>
<body>

<h1>Script Obfuscator</h1>

<h2>Enter your script:</h2>
<textarea id="inputScript" placeholder='Example: print("Hello World")'></textarea><br>

<button id="sendRequest">Obfuscate Script</button>

<div class="spinner" id="spinner">
  <p>Obfuscating script, please wait...</p>
</div>

<h2>Obfuscated Output:</h2>
<textarea id="result" readonly></textarea>

<div id="linkSection">
  <button id="linkButton">View Uploaded Script on GitHub</button>
</div>

<script>
document.getElementById('sendRequest').addEventListener('click', async function() {
  const inputScript = document.getElementById('inputScript').value.trim();
  const resultArea = document.getElementById('result');
  const spinner = document.getElementById('spinner');
  const linkButton = document.getElementById('linkButton');

  if (!inputScript) {
    alert('Please enter a script first.');
    return;
  }

  resultArea.value = '';
  spinner.style.display = 'block';
  linkButton.style.display = 'none';

  try {
    const response = await fetch('/obfuscate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ script: inputScript })
    });

    const data = await response.json();
    spinner.style.display = 'none';

    if (data.obfuscated) {
      resultArea.value = data.obfuscated;
      linkButton.style.display = 'inline-block';
      linkButton.onclick = () => window.open(data.githubUrl, '_blank');
      alert('Script successfully obfuscated!');
    } else {
      resultArea.value = 'Error: ' + (data.error || 'Unexpected error');
    }
  } catch (error) {
    spinner.style.display = 'none';
    resultArea.value = 'Request failed: ' + error.message;
  }
});
</script>

</body>
</html>
`;

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});
