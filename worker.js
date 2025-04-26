
// cloudflare_worker.js

const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const TARGET_URL = 'https://wearedevs.net/api/obfuscate';

async function handleRequest(event) {
const request = event.request;
const url = new URL(request.url);

// Access environment variables from the env object
const GITHUB_TOKEN = event.env.GITHUB_TOKEN;
const GITHUB_REPO = event.env.GITHUB_REPO;
const GITHUB_BRANCH = event.env.GITHUB_BRANCH || "main";  // Default to 'main' if not set
const GITHUB_API_URL = 'https://api.github.com/repos/${GITHUB_REPO}/contents/';

// Serve the HTML page directly if the request is at the root
if (url.pathname === "/") {
return new Response(htmlContent, {
headers: { "Content-Type": "text/html; charset=utf-8" },
});
}

// Handle the obfuscation POST request
if (url.pathname === "/obfuscate" && request.method === "POST") {
const body = await request.json();
const inputScript = body.script;

if (!inputScript) {  
  return new Response(JSON.stringify({ error: "No script provided" }), { status: 400 });  
}  

try {  
  // Request to the obfuscation API  
  const response = await fetch(CORS_PROXY + TARGET_URL, {  
    method: "POST",  
    headers: {  
      "Content-Type": "application/json",  
    },  
    body: JSON.stringify({ script: inputScript }),  
  });  

  if (!response.ok) {  
    return new Response(JSON.stringify({ error: "Failed to obfuscate script" }), { status: 500 });  
  }  

  const data = await response.json();  
  if (data && data.obfuscated) {  
    // Generate a unique filename for the obfuscated script  
    const fileName = `obfuscated_${crypto.randomUUID()}.js`;  

    // Upload the obfuscated script to GitHub  
    const uploadUrl = await uploadToGitHub(fileName, data.obfuscated, GITHUB_API_URL, GITHUB_TOKEN, GITHUB_BRANCH);  

    // Return the GitHub URL of the uploaded file  
    return new Response(JSON.stringify({ obfuscated: data.obfuscated, githubUrl: uploadUrl }), {  
      headers: { "Content-Type": "application/json" },  
    });  
  } else {  
    return new Response(JSON.stringify({ error: "Unexpected response format" }), { status: 500 });  
  }  
} catch (error) {  
  return new Response(JSON.stringify({ error: error.message }), { status: 500 });  
}

}

// Return a 404 for other routes
return new Response("Not Found", { status: 404 });
}

// Upload the obfuscated script to GitHub
async function uploadToGitHub(fileName, fileContent, GITHUB_API_URL, GITHUB_TOKEN, GITHUB_BRANCH) {
const contentBase64 = btoa(fileContent); // Convert content to Base64
const commitMessage = "Upload obfuscated script";

const body = JSON.stringify({
message: commitMessage,
content: contentBase64,
branch: GITHUB_BRANCH,  // Use the branch set in the environment variable
});

const response = await fetch(GITHUB_API_URL + fileName, {
method: "PUT",
headers: {
"Content-Type": "application/json",
"Authorization": \token ${GITHUB_TOKEN}`,`
},
body,
});

if (!response.ok) {
throw new Error(Failed to upload to GitHub: ${response.statusText});
}

const data = await response.json();
return data.content.html_url;  // Return the URL of the uploaded file on GitHub
}

// HTML content to serve
const htmlContent = `

<!DOCTYPE html>  <html lang="en">  
<head>  
    <meta charset="UTF-8">  
    <meta name="viewport" content="width=device-width, initial-scale=1.0">  
    <title>Obfuscate Your Script</title>  
    <style>  
        textarea {  
            width: 90%;  
            height: 150px;  
            font-family: monospace;  
            margin-top: 10px;  
        }  
        #result {  
            height: 200px;  
        }  
    </style>  
</head>  
<body>  
    <h1>Obfuscate Your Script</h1>  <h2>Enter your script:</h2>  
<textarea id="inputScript" placeholder='Example: print("Hello World")'></textarea><br>  

<button id="sendRequest">Obfuscate Script</button>  

<h2>Obfuscated Output:</h2>  
<textarea id="result" readonly></textarea>  

<script>  
    document.getElementById('sendRequest').addEventListener('click', function() {  
        const inputScript = document.getElementById('inputScript').value.trim();  

        if (!inputScript) {  
            alert('Please enter a script first.');  
            return;  
        }  

        fetch('/obfuscate', {  
            method: 'POST',  
            headers: {  
                'Content-Type': 'application/json',  
            },  
            body: JSON.stringify({  
                script: inputScript  
            })  
        })  
        .then(response => response.json())  
        .then(data => {  
            if (data.obfuscated) {  
                document.getElementById('result').value = data.obfuscated;  
                alert("Script successfully obfuscated! You can view it here: " + data.githubUrl);  
            } else {  
                document.getElementById('result').value = 'Error: ' + (data.error || 'Unexpected error');  
            }  
        })  
        .catch(error => {  
            document.getElementById('result').value = 'Request failed: ' + error.message;  
        });  
    });  
</script>

</body>  
</html>  
`;  addEventListener("fetch", (event) => {
event.respondWith(handleRequest(event));
});

