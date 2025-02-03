// public/client.js
(async function() {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
  
    const response = await fetch("/api/points");
    const points = await response.json();
    console.log(`Total points received: ${points.length}`);  // Debugging
  
    if (points.length < 8500) {
      console.error("Missing points! Check the database.");
    }
  
    // Compute extents for x and y to create scales
    const xExtent = d3.extent(points, d => d.x);
    const yExtent = d3.extent(points, d => d.y);
    const margin = 40;
  
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([margin, width - margin]);
  
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([height - margin, margin]); // invert y axis so that larger values are higher
  
    // Initial zoom transform
    let currentTransform = d3.zoomIdentity;
  
    // Draw function uses the current transform to draw all points
    function draw(transform = d3.zoomIdentity) {
        context.save();
        context.clearRect(0, 0, width, height);
        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);
      
        points.forEach(point => {
          const cx = xScale(point.x);
          const cy = yScale(point.y);
          context.beginPath();
          context.arc(cx, cy, 1, 0, 2 * Math.PI);  // Smaller dots
          context.fillStyle = "rgba(255, 0, 0, 0.5)";  // Transparency
          context.fill();
        });
      
        context.restore();
      }
  
    // Setup d3 zoom behavior on the canvas element
    const zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .on("zoom", (event) => {
        currentTransform = event.transform;
        draw(currentTransform);
      });
  
    d3.select(canvas).call(zoom);
  
    // Redraw on window resize
    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      xScale.range([margin, width - margin]);
      yScale.range([height - margin, margin]);
      draw(currentTransform);
    });
  
    // Initial draw
    draw();
  })();
  