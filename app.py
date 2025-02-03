from flask import Flask, render_template_string, request, jsonify
from pathlib import Path
import time

app = Flask(__name__)
app.static_folder = 'thumbnails'

# HTML template with CSS Grid and detailed performance metrics
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Thumbnail Grid - Load All</title>
    <style>
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
            gap: 5px;
            padding: 10px;
        }
        .thumbnail {
            width: 100%;
            height: auto;
            display: block;
        }
        #metrics {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            z-index: 1000;
        }
    </style>
    <script>
        const startTime = performance.now();
        
        window.onload = function() {
            const loadTime = performance.now();
            const totalTime = loadTime - startTime;
            const imageCount = document.getElementsByTagName('img').length;
            
            // Get network stats
            const resources = performance.getEntriesByType('resource');
            const imageResources = resources.filter(r => r.initiatorType === 'img');
            const totalBytes = imageResources.reduce((acc, r) => acc + (r.transferSize || 0), 0);
            const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
            
            // Send metrics to server
            fetch('/log-metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    loadTime: totalTime,
                    imageCount: imageCount,
                    totalMB: totalMB
                })
            });
            
            document.getElementById('metrics').innerHTML = `
                Total Images: ${imageCount}<br>
                Load Time: ${(totalTime/1000).toFixed(2)} seconds<br>
                Total Data: ${totalMB} MB<br>
                Avg per Image: ${(totalBytes/imageCount/1024).toFixed(2)} KB
            `;
        };
    </script>
</head>
<body>
    <div id="metrics">Loading...</div>
    <div class="grid">
        {% for image in images %}
            <img class="thumbnail" src="{{ url_for('static', filename=image) }}">
        {% endfor %}
    </div>
</body>
</html>
'''

@app.route('/')
def index():
    start_time = time.time()
    
    # Get all thumbnail files
    thumbnail_dir = Path(app.static_folder)
    images = [f.name for f in thumbnail_dir.glob('*.jpg')]
    
    server_time = time.time() - start_time
    print(f"Server processing time: {server_time:.2f} seconds")
    print(f"Total images: {len(images)}")
    
    return render_template_string(HTML_TEMPLATE, images=images)

@app.route('/log-metrics', methods=['POST'])
def log_metrics():
    metrics = request.json
    print(f"\nPAGE LOAD COMPLETE:")
    print(f"Load time: {metrics['loadTime']/1000:.2f} seconds")
    print(f"Images loaded: {metrics['imageCount']}")
    print(f"Total data: {metrics['totalMB']} MB\n")
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
