import React, { useState } from 'react';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Marker, Polyline } from 'react-native-maps';
import { getDistance } from 'geolib';
import { Audio } from 'expo-av';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ImageBackground,
  Modal,
  Dimensions
} from 'react-native';

SplashScreen.preventAutoHideAsync();

/* 
The GeoGuessr App is a geolocation game where users must correctly identify the location of an image shown on their screen. The app features 10 images, ranging from all of the world. On the game's start, a marker pin is dropped in San Fransisco. The user can either tap on the screen or drag the marker around to the desired location. A small image preview is located in the top left of the screen, and the user can click on this preview to pull up an expanded, larger version of the image which is more helpful. When the user has finalized the location of their marker, they will press the "Guess" button. After pressing this button, an Animated Region Change will occur that will focus the map's region on to the correct location, and a line will appear along with a green marker between the user's selected location and the actual location of the image. The distance between the two points will be calculated and displayed on the top right of the screen. The user's score will also be showcased on the top left of the screen, which is calculated using an exponential function (the highest the user can earn is 1000 points per round). The user then presses the "Continue" button, which takes them to the next round. At this time, the user's selected marker will now exist at the point of the previous correct location and the map region will zoom out, in order to make the app more user-friendly. The user continues the game for all 10 rounds. After they finish, they are taken to a screen that displays their score and their high score. We are successfully using Async Storage to store high score data even after the user closes the app. Overall, the app is fairly simple but for the most part, everthing works as intended. Sound effects play throughout the game.

LIMITATION #1: OPTIMIZATION. The images, especially the larger resolution ones, sometimes take a long time to load. The map is sometimes laggy and unresponsive. The first time a sound effect plays, the sound is slightly delayed (presumably due to the sound file taking a period of time to load). 
LIMITATION #2: The scaling is SLIGHTLY different on different device sizes. I believe this is due to using absolute positioning; it is a miniscule detail that is somewhat aggravating. Additionally, on different device sizes, the latitudeDelta and longitudeDelta produce different region sizes. For instance, the "_zoomOut()" function zooms out slightly more on smaller device sizes than larger ones.
LIMITATION #3: When the map zooms out to much / focuses on a different region, it will sometimes zoom out beyond the scale of the map and show a white border at the top. Similarly, when the image is the "Antartica" image, the animation won't zoom to the correct marker because the full region would cut off the map.
*/

export default function App() {
  const [finalDistance, setFinalDistance] = useState(0);
  const [screen, setScreen] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [isMarkerDraggable, setIsMarkerDraggable] = useState(true);
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [touchableDisplay, setTouchableDisplay] = useState('Guess');
  const [roundNumber, setRoundNumber] = useState(0);
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  //aspectRatio is ratio of images' height to its width
  const [images, setImages] = useState([
    {
      id: 0,
      source: require('./assets/alligator.jpg'),
      latitude: 25.002579228289775,
      longitude: -81.01019728928804,
      aspectRatio: 0.625
    },
    {
      id: 1,
      source: require('./assets/brazil.jfif'),
      latitude: -22.9027800,
      longitude: -43.2075,
      aspectRatio: 1.33285714
    },
    {
      id: 2,
      source: require('./assets/luxor.webp'),
      latitude: 25.687243,
      longitude: 32.639637,
      aspectRatio: 0.741875
    },
    {
      id: 3,
      source: require('./assets/neworleans4k.jpg'),
      latitude: 29.951065,
      longitude: -90.071533,
      aspectRatio: 0.66541353
    },
    {
      id: 4,
      source: require('./assets/tokyotower.webp'),
      latitude: 35.652832,
      longitude: 139.839478,
      aspectRatio: 0.625
    },
    {
      id: 5,
      source: require('./assets/shanghai.jfif'),
      latitude: 31.23039,
      longitude: 121.473702,
      aspectRatio: 0.61814556
    },
    {
      id: 6,
      source: require('./assets/mountRainer.jpg'),
      latitude: 46.879967,
      longitude: -121.726906,
      aspectRatio: 0.75
    },
    {
      id: 7,
      source: require('./assets/greenland.jpeg'),
      latitude: 74.34955,
      longitude: -41.08989,
      aspectRatio: 0.66433333
    },
    {
      id: 8,
      source: require('./assets/plane.webp'),
      latitude: -33.1376,
      longitude: 81.8262,
      aspectRatio: 0.74848485
    },
    {
      id: 9,
      source: require('./assets/monkey.jpg'),
      latitude: 18.93016,
      longitude: 72.83028,
      aspectRatio: 0.5625
    },
  ]);
  const [removedImages, setRemovedImages] = useState([]);
  const [imageMarkerOpacity, setImageMarkerOpacity] = useState(0);
  const [polyLineStrokeWidth, setPolyLineStrokeWidth] = useState(0);
  const [currentImageID, setCurrentImageID] = useState(0);
  const [coordinate, setCoordinate] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
  });

  const [sound, setSound] = useState();
  async function playSound(s) { //Async Function that Plays Soundbites
    if (s == 'victory') {
      const { sound } = await Audio.Sound.createAsync(require('./assets/trumpet.mp3'));
      setSound(sound);
      await sound.playAsync();
      }   
    if (s == 'loser') {
      const { sound } = await Audio.Sound.createAsync(require('./assets/losernoise.mp3'));
      setSound(sound);
      await sound.playAsync();
      }     
    if (s == 'cashregister') {
      const { sound } = await Audio.Sound.createAsync(require('./assets/cashregister.mp3'));
      setSound(sound);
      await sound.playAsync();
      } 
  }

  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const storeHighScore = async (score) => {
    try {
      const jsonScoreValue = JSON.stringify(score);
      await AsyncStorage.setItem('highscore', jsonScoreValue);
    } catch (e) {
      // saving error
    }
  };

  const retrieveHighScore = async () => {
    try {
      const value = await AsyncStorage.getItem('highscore');
      if (value !== null && value !== undefined) {
        setHighScore(JSON.parse(value));
      } else {
        setHighScore(0);
      }
    } catch (e) {
      // error reading value
    }
  };

  const animation = new Animated.Value(0);
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: true, iterations: Number.MAX_SAFE_INTEGER }
    ).start();
  });

  const nextButtonOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  function onSubmit() {
    var distanceInMeters = getDistance(
      { latitude: coordinate.latitude, longitude: coordinate.longitude },
      { latitude: images[currentImageID].latitude, longitude: images[currentImageID].longitude })

    setImageMarkerOpacity(1);
    setPolyLineStrokeWidth(6);
    setFinalDistance(distanceInMeters / 1000);

    var points = 0;
    points = 1000 * Math.pow(1.003845015, (distanceInMeters / 1000) * -1);

    if (Math.round(points) > 0) {
      playSound('cashregister');
    }

    setCurrentScore((prevScore) => prevScore + points);
    setIsMarkerDraggable(false);
    setTouchableDisplay('Continue');

    _animateToGoal();
  }

  function onNext() {
    let tempArray = [...images];
    let newArray = [...removedImages];
    if (roundNumber != 0) {
      setCoordinate({latitude: images[currentImageID].latitude, longitude: images[currentImageID].longitude})
      _zoomOut();
      newArray.push(tempArray.splice(currentImageID, 1)[0]);
      for (var i = 0; i < newArray.length; i++) {
        newArray[i].id = i;
      }
      setRemovedImages(newArray);
    }
    if (roundNumber + 1 <= 10) {
      setImages(tempArray);

      setCurrentImageID(Math.floor(Math.random() * tempArray.length));
      setPolyLineStrokeWidth(0);
      setImageMarkerOpacity(0);
      setRoundNumber((roundNumber) => roundNumber + 1);

      setIsMarkerDraggable(true);
      setFinalDistance(0);
      setTouchableDisplay('Guess');
    } else {
      setScreen(2);
      if (Math.round(currentScore) > 0) {
        playSound('victory');
      } else {
        playSound('loser')
      }


      setImages(newArray);
      setCurrentImageID(Math.floor(Math.random() * 10));
      setRoundNumber(0);
      setRemovedImages([]);
      setCoordinate({
        latitude: 37.78825,
        longitude: -122.4324,
      });
      if (currentScore > highScore) {
        setHighScore(currentScore);
        storeHighScore(currentScore);
      }
    }
  }

  function mapPress(event) {
    setCoordinate(event.nativeEvent.coordinate);
    console.log(event.nativeEvent.coordinate)
  }

  mapStyle = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#ebe3cd"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#523735"
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#f5f1e6"
        }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#c9b2a6"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#dcd2be"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#ae9e90"
        }
      ]
    },
    {
      "featureType": "landscape.natural",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#dfd2ae"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#dfd2ae"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#93817c"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#a5b076"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#447530"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#f5f1e6"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#fdfcf8"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#f8c967"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#e9bc62"
        }
      ]
    },
    {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#e98d58"
        }
      ]
    },
    {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry.stroke",
      "stylers": [
        {
          "color": "#db8555"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#806b63"
        }
      ]
    },
    {
      "featureType": "transit.line",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#dfd2ae"
        }
      ]
    },
    {
      "featureType": "transit.line",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#8f7d77"
        }
      ]
    },
    {
      "featureType": "transit.line",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#ebe3cd"
        }
      ]
    },
    {
      "featureType": "transit.station",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#dfd2ae"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#b9d3c2"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#92998d"
        }
      ]
    }
  ]

  const _mapView = React.createRef();

  function _animateToGoal () {
    if (_mapView.current) {
      _mapView.current.animateToRegion({
        latitude: images[currentImageID].latitude,
        longitude: images[currentImageID].longitude,
        latitudeDelta: 30,
        longitudeDelta: 30,              
      }, 1000);
    }
  }

  function _zoomOut () {
    if (_mapView.current) {
      _mapView.current.animateToRegion({
        latitude: images[currentImageID].latitude,
        longitude: images[currentImageID].longitude,
        latitudeDelta: 100,
        longitudeDelta: 100,              
      }, 1000);
    }
  }

  const [fontsLoaded] = useFonts({
    madetommy: require('./assets/madetommy.otf'),
  });

  const onLayoutRootView = React.useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (screen == 0) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#3a3b3c',
          },
        ]}
        onLayout={onLayoutRootView}>
        <Text style={styles.title}>GeoGuessr</Text>
        <Image
          source={require('./assets/globe.webp')}
          style={{ width: '100%', height: '50%', marginLeft: '6.5%' }}
          resizeMode={'contain'}
        />
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            setScreen(1);
            setCurrentScore(0);
            retrieveHighScore();
            onNext();
          }}>
          <Animated.Text
            style={[
              styles.distanceText,
              { fontSize: 40, marginTop: '5%', opacity: nextButtonOpacity },
            ]}>
            Start
          </Animated.Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen == 1) {
    return (
      <View style={[styles.container, {backgroundColor: "#b9d3c2"}]} onLayout={onLayoutRootView}>
        <MapView style={styles.map} provider={PROVIDER_GOOGLE} onPress={(event) => {if (isMarkerDraggable) {mapPress(event)}}} customMapStyle={mapStyle}
          ref={_mapView}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 90,
            longitudeDelta: 90,
          }}

        >
          <Marker
            draggable={isMarkerDraggable}
            coordinate={coordinate}
            onDragEnd={(e) => {
              setCoordinate({
                latitude: e.nativeEvent.coordinate.latitude,
                longitude: e.nativeEvent.coordinate.longitude,
              });
            }}
          >
            <Image
              source={require('./assets/redpushpin.png')}
              style={{width: windowWidth * 0.08, height: windowWidth * 0.08}}
            />
          </Marker>
          <Marker
            opacity={imageMarkerOpacity}
            coordinate={{
              latitude: images[currentImageID].latitude,
              longitude: images[currentImageID].longitude,
            }}
          >
            <Image
              source={require('./assets/greenpushpin.png')}
              style={{width: windowWidth * 0.08, height: windowWidth * 0.08}}
            />            
          </Marker>
          <Polyline
            strokeColor={'red'}
            strokeWidth={polyLineStrokeWidth}
            coordinates={[
              {
                latitude: images[currentImageID].latitude,
                longitude: images[currentImageID].longitude,
              },
              {
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
              },
            ]}
          />
        </MapView>
        <View style={styles.scorebar}>
          <View style={styles.icon}>
            <Text style={styles.distanceText}>{Math.round(currentScore)}</Text>
            <Text style={styles.iconHeader}>Score</Text>
          </View>
          <View style={styles.icon}>
            <Text style={styles.distanceText}>{roundNumber} / 10</Text>
            <Text style={styles.iconHeader}>Round</Text>
          </View>
          <View style={[styles.icon, { borderRightWidth: 0 }]}>
            <Text style={styles.distanceText}>
              {parseFloat(finalDistance).toFixed(2)} km
            </Text>
            <Text style={styles.iconHeader}>Distance</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            touchableDisplay == 'Guess' ? onSubmit() : onNext();
          }}
          style={[
            styles.submitButton,
            {
              borderColor: 'white',
              borderWidth: 1,
            },
          ]}>
          <Text style={styles.distanceText}>{touchableDisplay}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.imagePreview}>
          <ImageBackground
            source={images[currentImageID].source}
            style={{ width: '100%', height: '100%' }}
            resizeMode={'cover'}
            imageStyle={styles.imageStyle}
          />
          <Text style={styles.zoomText}>Tap to View</Text>
        </TouchableOpacity>
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}>
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={{
              width: '90%',
              height: windowWidth * 0.9 * images[currentImageID].aspectRatio,
              justifyContent: 'flex-start',
              alignSelf: 'center',
              marginTop: windowHeight * 0.175,
              alignItems: 'flex-start',
              alignContent: 'flex-start'
            }}>
            <ImageBackground
              source={images[currentImageID].source}
              style={{
                width: '100%',
                height: '100%',
                alignSelf: 'flex-start',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                backgroundColor: '#3a3b3c',
                borderRadius: 20 
              }}
              resizeMode={'contain'}
              imageStyle={{
                alignSelf: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'white',
                borderRadius: 20
              }}
            />
            <Text style={[styles.zoomText, {textAlign: 'center', alignSelf: 'center'}]}>Tap to Close</Text>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  if (screen == 2) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#3a3b3c',
          },
        ]}
        onLayout={onLayoutRootView}>
        <Text style={[styles.title, { fontSize: 40 }]}>Score</Text>
        <Text
          style={[styles.distanceText, { fontSize: 80, marginBottom: '5%' }]}>
          {Math.round(currentScore)}
        </Text>
        <Text style={[styles.title, { fontSize: 40 }]}>High Score</Text>
        <Text
          style={[styles.distanceText, { fontSize: 80, marginBottom: '5%' }]}>
          {Math.round(highScore)}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setScreen(0);
          }}
          style={[
            styles.submitButton,
            {
              position: 'relative',
              top: '0%',
              marginLeft: '0%',
              alignSelf: 'center',
              height: '10%',
              marginTop: '5%',
            },
          ]}>
          <Text style={styles.distanceText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#ecf0f1',
  },

  map: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  scorebar: {
    flexDirection: 'row',
    backgroundColor: '#3a3b3c',
    height: '10%',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 30,
    marginTop: '15%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray'
  },

  distanceText: {
    color: 'white',
    fontSize: 25,
    textAlign: 'center',
    fontFamily: 'madetommy',
  },

  iconHeader: {
    textAlign: 'center',
    color: 'white',
    fontSize: 12,
    fontFamily: 'madetommy',
  },

  icon: {
    alignSelf: 'center',
    justifyContent: 'center',
    width: '33%',
    height: '100%',
    borderRightColor: 'gray',
    borderRightWidth: 1,
  },

  submitButton: {
    backgroundColor: '#66c992',
    height: '7%',
    width: '90%',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: 25,
    marginBottom: '10%',
    position: 'absolute',
    marginLeft: '5%',
    top: '88%',
  },

  title: {
    color: 'white',
    fontFamily: 'madetommy',
    fontSize: 70,
    width: '100%',
    textAlign: 'center',
    marginBottom: '5%',
  },

  zoomText: {
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'madetommy',
    color: '#3a3b3c',
  },

  imagePreview: {
    width: '23%',
    height: '15%',
    alignSelf: 'flex-start',
    marginLeft: '5%',
    marginBottom: windowHeight * 0.675,
  },

  imageStyle: {
    borderRadius: 20,
    height: '100%',
    width: '100%',
    borderWidth: 1,
    borderColor: 'white',
  }
});