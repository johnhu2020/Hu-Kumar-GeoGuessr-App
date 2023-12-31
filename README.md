# GeoGuessr Game

**Created using React Native expo**

The GeoGuessr App is a geolocation game where users must correctly identify the location of an image shown on their screen. The app features 10 images, ranging from all of the world. On the game's start, a marker pin is dropped in San Fransisco. The user can either tap on the screen or drag the marker around to the desired location. A small image preview is located in the top left of the screen, and the user can click on this preview to pull up an expanded, larger version of the image which is more helpful. When the user has finalized the location of their marker, they will press the "Guess" button. After pressing this button, an Animated Region Change will occur that will focus the map's region on to the correct location, and a line will appear along with a green marker between the user's selected location and the actual location of the image. The distance between the two points will be calculated and displayed on the top right of the screen. The user's score will also be showcased on the top left of the screen, which is calculated using an exponential function (the highest the user can earn is 1000 points per round). The user then presses the "Continue" button, which takes them to the next round. At this time, the user's selected marker will now exist at the point of the previous correct location and the map region will zoom out, in order to make the app more user-friendly. The user continues the game for all 10 rounds. After they finish, they are taken to a screen that displays their score and their high score. We are successfully using Async Storage to store high score data even after the user closes the app. Overall, the app is fairly simple but for the most part, everthing works as intended. Sound effects play throughout the game.

LIMITATION #1: OPTIMIZATION. The images, especially the larger resolution ones, sometimes take a long time to load. The map is sometimes laggy and unresponsive. The first time a sound effect plays, the sound is slightly delayed (presumably due to the sound file taking a period of time to load). 

LIMITATION #2: The scaling is SLIGHTLY different on different device sizes. I believe this is due to using absolute positioning; it is a miniscule detail that is somewhat aggravating. Additionally, on different device sizes, the latitudeDelta and longitudeDelta produce different region sizes. For instance, the "_zoomOut()" function zooms out slightly more on smaller device sizes than larger ones.

LIMITATION #3: When the map zooms out to much / focuses on a different region, it will sometimes zoom out beyond the scale of the map and show a white border at the top. Similarly, when the image is the "Antartica" image, the animation won't zoom to the correct marker because the full region would cut off the map.
Open the `App.js` file to start writing some code. You can preview the changes directly on your phone or tablet by scanning the **QR code** or use the iOS or Android emulators. When you're done, click **Save** and share the link!

When you're ready to see everything that Expo provides (or if you want to use your own editor) you can **Download** your project and use it with [expo-cli](https://docs.expo.io/get-started/installation).

All projects created in Snack are publicly available, so you can easily share the link to this project via link, or embed it on a web page with the `<>` button.

If you're having problems, you can tweet to us [@expo](https://twitter.com/expo) or ask in our [forums](https://forums.expo.io/c/snack).

Snack is Open Source. You can find the code on the [GitHub repo](https://github.com/expo/snack).
