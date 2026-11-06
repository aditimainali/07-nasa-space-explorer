
 // Get date inputs
const startInput = document.getElementById("startDate");
const endInput = document.getElementById("endDate");

// Set up date inputs
setupDateInputs(startInput, endInput);

// Get button and gallery
const button = document.getElementById("getImages");
const gallery = document.getElementById("gallery");

// Random space facts
const facts = [
  "One day on Venus is longer than one year on Venus.",
  "The Sun contains about 99.8% of the solar system's mass.",
  "Neptune has some of the fastest winds in our solar system.",
  "A day on Jupiter lasts about 10 hours.",
  "Footprints on the Moon can last for millions of years.",
  "Saturn is less dense than water.",
  "The Moon is slowly moving away from Earth."
];

// Start with a random fact, then cycle through the list.
let factIndex = Math.floor(Math.random() * facts.length);
const factText = document.getElementById("factText");

function showNextFact() {
  factText.classList.remove("fact-slide-in");
  factText.textContent = facts[factIndex];
  factIndex = (factIndex + 1) % facts.length;
  void factText.offsetWidth;
  factText.classList.add("fact-slide-in");
}

showNextFact();
setInterval(showNextFact, 3000);

// Get images when button is clicked
button.addEventListener("click", async function() {

  const startDate = startInput.value;
  const endDate = endInput.value;

  // Check dates
  if (startDate === "" || endDate === "") {
    alert("Please select both dates.");
    return;
  }

  if (startDate > endDate) {
    alert("Start date must be before end date.");
    return;
  }

  // Show loading message
  gallery.innerHTML = "<p>🔄 Loading space photos...</p>";

  // Get NASA's date-specific articles through the local server.
  const apiURL = `/api/apod?start_date=${startDate}&end_date=${endDate}`;

  try {

    // Fetch NASA data from the local server
    const response = await fetch(apiURL);

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("The NASA data server is not available. Deploy server.js with the site.");
    }

    const data = await response.json();

    // Check for API errors
    if (!response.ok) {
      throw new Error(data.error || "NASA could not return these pictures.");
    }

    // Check that data is an array
    if (!Array.isArray(data)) {
      throw new Error("NASA did not return a list of articles.");
    }

    // Clear gallery
    gallery.innerHTML = "";

    let imageCount = 0;
    const articlesByDate = new Map(data.map(item => [item.date, item]));
    const currentDate = new Date(`${startDate}T00:00:00Z`);
    const lastDate = new Date(`${endDate}T00:00:00Z`);

    // Read each NASA article and create its gallery card
    while (currentDate <= lastDate) {

      const selectedDate = currentDate.toISOString().slice(0, 10);
      const item = articlesByDate.get(selectedDate);

      if (!item) {
        const card = document.createElement("div");
        card.className = "gallery-item";

        const title = document.createElement("h3");
        title.textContent = `No APOD available for ${selectedDate}`;
        card.appendChild(title);

        const message = document.createElement("p");
        message.textContent = "NASA's archive has no picture entry for this date.";
        card.appendChild(message);

        gallery.appendChild(card);
        imageCount++;
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        continue;
      }

      const article = new DOMParser().parseFromString(item.content, "text/html");
      const articleTitle = article.querySelector(".media-detail-hero__content-row h1");
      const imageLink = article.querySelector(".media-detail-hero__media a[href]");
      const articleImage = imageLink && imageLink.querySelector("img");
      const articleVideo = article.querySelector(".media-detail-hero__media video, .media-detail-hero__media iframe");
      const description = article.querySelector(".media-detail-hero__description");
      const titleText = articleTitle ? articleTitle.textContent.trim() : item.title;
      const explanation = description
        ? description.textContent.replace(/^Explanation:\s*/, "").trim()
        : "No description is available for this date.";

      // Create gallery card
      const card = document.createElement("div");
      card.className = "gallery-item";

      // Display the APOD image when NASA has one for this date
      if (imageLink && articleImage) {
        const image = document.createElement("img");
        image.src = articleImage.src;
        image.alt = articleImage.alt || titleText;
        image.loading = "lazy";
        card.appendChild(image);

        const modalItem = {
          title: titleText,
          date: item.date,
          url: articleImage.src,
          hdurl: articleImage.src,
          explanation: explanation
        };

        const openImageModal = function() {
          openModal(modalItem);
        };
        card.addEventListener("click", openImageModal);

        let triedOriginalImage = false;
        image.addEventListener("error", function() {
          if (!triedOriginalImage && articleImage.src !== imageLink.href) {
            triedOriginalImage = true;
            image.src = imageLink.href;
            modalItem.url = imageLink.href;
            modalItem.hdurl = imageLink.href;
            return;
          }

          image.remove();
          card.removeEventListener("click", openImageModal);

          const message = document.createElement("p");
          message.textContent = "NASA's image could not load. Use the NASA article link below.";
          card.insertBefore(message, card.firstChild);
        });
      } else {
        const message = document.createElement("p");
        message.textContent = articleVideo
          ? "This APOD entry is a video."
          : "No still image is available for this date.";
        card.appendChild(message);
      }

      // Add title
      const title = document.createElement("h3");
      title.textContent = titleText;
      card.appendChild(title);

      // Add date
      const date = document.createElement("p");
      date.textContent = item.date;
      card.appendChild(date);

      const articleLink = document.createElement("a");
      articleLink.href = item.link;
      articleLink.target = "_blank";
      articleLink.rel = "noopener noreferrer";
      articleLink.textContent = articleVideo
        ? "Watch APOD video on NASA"
        : "View NASA article";
      articleLink.addEventListener("click", function(event) {
        event.stopPropagation();
      });
      card.appendChild(articleLink);

      // Add card to gallery
      gallery.appendChild(card);

      imageCount++;
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // No results
    if (imageCount === 0) {
      gallery.innerHTML =
        "<p>No astronomy photos available for these dates.</p>";
    }

  } catch (error) {

    gallery.textContent =
      "Unable to load NASA photos: " + error.message;

    console.log("NASA Error:", error);
  }

});

// Modal elements
const modal = document.getElementById("imageModal");
const closeModal = document.getElementById("closeModal");

// Open modal
function openModal(item) {

  document.getElementById("modalTitle").textContent = item.title;

  document.getElementById("modalDate").textContent = item.date;

  document.getElementById("modalImage").src = item.hdurl || item.url;

  document.getElementById("modalExplanation").textContent = item.explanation;

  modal.style.display = "flex";
}

// Close modal with button
closeModal.addEventListener("click", function() {
  modal.style.display = "none";
});

// Close modal by clicking outside
modal.addEventListener("click", function(event) {

  if (event.target === modal) {
    modal.style.display = "none";
  }

});

// Close modal with Escape key
document.addEventListener("keydown", function(event) {

  if (event.key === "Escape") {
    modal.style.display = "none";
  }

});
