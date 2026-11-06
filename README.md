# Project 7: NASA API - Space Explorer App
NASA releases a new "Astronomy Picture of the Day" (APOD) every day—spotlighting breathtaking images of galaxies, stars, planets, and more.

Your task is to build an interactive web app that fetches and displays these photos using [NASA's API](https://api.nasa.gov/). Users will pick a date range and instantly view stunning photos from across the cosmos, along with titles and descriptions.

You'll get to use your skills to build something that's actually connected to real-world data from one of the most iconic organizations in the world.

## Run locally
Install Node.js 18 or newer, then run `node server.js` from this folder. Open `http://localhost:3000` in your browser. The local server fetches APOD articles from NASA so the gallery can display their images and descriptions.

## Deploy on Render
Connect this GitHub repository to Render and deploy it as a Blueprint using `render.yaml`. After deployment, open the Render URL to use the site. GitHub Pages only serves static files and cannot run the API server.

## Starter Files
- The provided files include a NASA logo, date inputs, a button, a placeholder for your gallery, and basic layout and styling to help you get started.
- It also includes built-in logic (in `dateRange.js`) to handle the valid APOD date range—from June 16, 1995 to today. No need to modify it.
- All your custom JavaScript should go in `script.js`. That's where you'll write the code that fetches data and displays your gallery.
