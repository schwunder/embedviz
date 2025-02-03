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
  const margin = 40;

  const xScale = d3.scaleLinear().domain(xExtent).range([margin, width - margin]);

  const yScale = d3.scaleLinear().domain(yExtent).range([height - margin, margin]); // Inverted Y-axis

  // Set thumbnail size
  const thumbWidth = 50;
  const thumbHeight = 50;

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
    context.translate(transform.x, transform.y);
    context.scale(transform.k, transform.k);

    points.forEach((point) => {
      const cx = xScale(point.x);
      const cy = yScale(point.y);
      if (point.img) {
        context.drawImage(point.img, cx - thumbWidth / 2, cy - thumbHeight / 2, thumbWidth, thumbHeight);
      }
    });

    context.restore();
  }

  // Initial zoom transform
  let currentTransform = d3.zoomIdentity;

  // Setup d3 zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.5, 20])
    .on("zoom", (event) => {
      currentTransform = event.transform;
      draw(currentTransform);
    });

  d3.select(canvas).call(zoom);

  // Handle window resize
  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    xScale.range([margin, width - margin]);
    yScale.range([height - margin, margin]);
    draw(currentTransform);
  });

  // **Final draw after everything is loaded**
  draw();
})();
