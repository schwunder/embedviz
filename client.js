(async function () {
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // Fetch points from API
  const response = await fetch("/api/points");
  const points = await response.json();
  console.log('open on port localhost:3000');
  console.log(`Total points received: ${points.length}`); // Debugging

  if (points.length < 8500) {
    console.error("Missing points! Check the database.");
  }

  // Compute extents for x and y to create scales
  const xExtent = d3.extent(points, (d) => d.x);
  const yExtent = d3.extent(points, (d) => d.y);
  const margin = 200;  // Increased margin for more spread

  // Multiply the range by a factor to spread points further apart
  const spreadFactor = 5;  // Increase this to spread points further
  width = canvas.width * spreadFactor;
  height = canvas.height * spreadFactor;

  const xScale = d3.scaleLinear()
    .domain(xExtent)
    .range([margin, width - margin]);

  const yScale = d3.scaleLinear()
    .domain(yExtent)
    .range([height - margin, margin]); // Inverted Y-axis

  // Set base thumbnail size
  const baseThumbWidth = 30;   // Smaller base size when zoomed out
  const baseThumbHeight = 30;
  const spacing = 300;         // Much larger spacing between points

  // Function to preload all images
  function preloadImages() {
    return Promise.all(
      points.map((point) => {
        return new Promise((resolve) => {
          const img = new Image();
          // Use encodeURI instead of encodeURIComponent for better handling of special characters
          const encodedFilename = encodeURI(point.filename);
          img.src = `/${encodedFilename}`; 
          img.onload = () => {
            console.log(`Loaded image: ${point.filename}`); // Log original filename for clarity
            point.img = img; // Attach loaded image to point
            resolve();
          };
          img.onerror = () => {
            console.error(`Failed to load image: ${point.filename}`); // Log original filename for clarity
            resolve(); // Prevent breaking on failed images
          };
        });
      })
    );
  }

  // Wait for all images to be preloaded before rendering
  console.log("Preloading images...");
  await preloadImages();
  console.log("All images preloaded. Rendering...");

  // Draw function using current transform
  function draw(transform = d3.zoomIdentity) {
    context.save();
    context.clearRect(0, 0, width, height);
    
    // Apply transform for panning and zooming
    context.translate(transform.x, transform.y);
    context.scale(transform.k, transform.k);

    points.forEach((point) => {
      const cx = xScale(point.x);
      const cy = yScale(point.y);
      
      if (point.img) {
        // Scale thumbnails based on zoom level
        const scaledWidth = baseThumbWidth * (1 + transform.k * 0.5);
        const scaledHeight = baseThumbHeight * (1 + transform.k * 0.5);
        
        context.drawImage(
          point.img,
          cx - scaledWidth / 2,
          cy - scaledHeight / 2,
          scaledWidth,
          scaledHeight
        );
      }
    });

    context.restore();
  }

  // Initial zoom transform
  let currentTransform = d3.zoomIdentity;

  // Setup d3 zoom behavior with wider zoom range
  const zoom = d3.zoom()
    .scaleExtent([0.1, 50])  // Allow zooming out further and in closer
    .on("zoom", (event) => {
      currentTransform = event.transform;
      draw(currentTransform);
    });

  d3.select(canvas).call(zoom);

  // Handle window resize
  window.addEventListener("resize", () => {
    const newWidth = window.innerWidth * spreadFactor;
    const newHeight = window.innerHeight * spreadFactor;
    xScale.range([margin, newWidth - margin]);
    yScale.range([newHeight - margin, margin]);
    draw(currentTransform);
  });

  // **Final draw after everything is loaded**
  draw();
})();
