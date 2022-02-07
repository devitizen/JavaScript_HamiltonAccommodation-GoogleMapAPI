let map, infoWindow, myMarker, geocodeMarker, directionsService, directionsRenderer, panorama;
let markers = [];

$(document).ready(function () {
    $("#btnAll").on("click", () => {
        displayAccommodations("All")
    });
    $("#btnHotel").on("click", () => {
        displayAccommodations("Hotel")
    });
    $("#btnMotel").on("click", () => {
        displayAccommodations("Motel")
    });
    $("#btnBB").on("click", () => {
        displayAccommodations("Bed and Breakfast")
    });
    $("#btnCampus").on("click", () => {
        displayAccommodations("Campus Accommodations")
    });

    $("#btnOn").on("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(displayMyLocation, showError);
        } else {
            alert("Geolocation is not supported by your browser!");
        }
    });
    $("#btnOff").on("click", () => {
        hideMyLocation()
    });

    $("#btnAddress").on("click", () => {
        let request = {
            address: $("#address").val()
        };
        geocodeDisplayLocation(request);
    });

    $("#btnClear").on("click", () => {
        $("#address").val("");
        if (geocodeMarker != null) {
            geocodeMarker.setMap(null);
            geocodeMarker = null;
            refreshDirectionList();
        }
    });

    $("#start").on("change", () => {
        displayRoute()
    });
    $("#end").on("change", () => {
        displayRoute()
    });
    $("#mode").on("change", () => {
        displayRoute()
    });
});

function initMap() {
    const initialCenter = {
        lat: 43.238816435385175, 
        lng: -79.88813323008486
    };
    map = new google.maps.Map(document.getElementById("map"), {
        center: initialCenter,
        zoom: 12
    });

    displayAccommodations("All");

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
}

function displayAccommodations(type) {
    setMapOnAll(null);
    markers = [];

    infoWindow = new google.maps.InfoWindow();
    for (const place of data.features) {
        if (type == "All" || place.properties.CATEGORY == type) {
            let placePosition = {
                lat: place.geometry.coordinates[1],
                lng: place.geometry.coordinates[0]
            };
            let marker = new google.maps.Marker({
                position: placePosition,
                title: place.properties.NAME,
                icon: "http://maps.google.com/mapfiles/kml/pal2/icon28.png"
            });
            let contentString =
                "<p class=\"fs-6 fw-bold\">" + place.properties.NAME + "</p>" +
                "<p>Type: " + place.properties.CATEGORY + "<p>" +
                "<p>Address: " + place.properties.ADDRESS + "<p>" +
                "<p>Website: <a href=\"" + place.properties.WEBSITE_URL + "\" target=\"_blank\">" + place.properties.WEBSITE_URL + "</a><p>" +
                "<button class=\"btn btn-outline-primary btn-sm\" type=\"button\" id=\"streetView\" " +
                    "onclick=\"displayStreet({ lat: " + placePosition.lat + "," + "lng:" + placePosition.lng + "})\">View street</button>";
            marker.addListener("click", () => {
                infoWindow.setContent(contentString);
                infoWindow.setOptions({
                    maxWidth: 400
                });
                infoWindow.open({
                    anchor: marker,
                    map,
                    shouldFocus: false
                });
            });

            markers.push(marker);
        }
    }

    setMapOnAll(map);
    refreshDirectionList();
}

function setMapOnAll(map) {
    for (const marker of markers) {
        marker.setMap(map);
    }
}

function displayMyLocation(position) {

    let myLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    myMarker = new google.maps.Marker({
        position: myLocation,
        title: "Current location",
        icon: "http://maps.google.com/mapfiles/kml/pal4/icon47.png"
    });
    myMarker.setMap(map);
    map.setCenter(myLocation);

    let infoWindow = new google.maps.InfoWindow({
        content: "You are here!"
    });
    infoWindow.open({
        anchor: myMarker,
        map,
        shouldFocus: false
    });

    refreshDirectionList();
}

function hideMyLocation() {
    myMarker.setMap(null);
    myMarker = null;
    refreshDirectionList();
}

function showError(error) {
    let message;
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            message = "An unknown error occurred.";
            break;
    }
    alert(message + " Please try again and allow the request to show your location.");
    $("#btnOff").prop("checked", true);
}

function geocodeDisplayLocation(request) {
    if (geocodeMarker) {
        geocodeMarker.setMap(null);
    }

    let geocoder = new google.maps.Geocoder();
    geocoder
        .geocode(request)
        .then((result) => {
            const {
                results
            } = result;
            geocodeMarker = new google.maps.Marker({
                position: results[0].geometry.location,
                title: "Place found - " + results[0].formatted_address,
                icon: "http://maps.google.com/mapfiles/kml/pal2/icon13.png"
            });
            geocodeMarker.setMap(map);
            map.setCenter(results[0].geometry.location);

            let infoWindow = new google.maps.InfoWindow({
                content: "You found this place!"
            });
            infoWindow.open({
                anchor: geocodeMarker,
                map,
                shouldFocus: false
            });

            refreshDirectionList();
            return results;
        })
        .catch((e) => {
            alert("Geocode was not successful for the following reason: " + e);
        });
}

function displayRoute() {
    let selectedStart = $("#start").val().split(",");
    let selectedEnd = $("#end").val().split(",");
    let selectedMode = $("#mode").val();
    let startPosition = new google.maps.LatLng(selectedStart[0], selectedStart[1]);
    let endPosition = new google.maps.LatLng(selectedEnd[0], selectedEnd[1]);

    let request = {
        origin: startPosition,
        destination: endPosition,
        travelMode: google.maps.TravelMode[selectedMode]
    };
    directionsService.route(request, function (result, status) {
        if (status == 'OK') {
            directionsRenderer.setDirections(result);
        } else {
            alert("Directions request failed due to " + status);
        }
    });
}

function refreshDirectionList() {
    let allMarkers = [];
    if (myMarker) {
        allMarkers.push(myMarker);
    }
    if (geocodeMarker) {
        allMarkers.push(geocodeMarker);
    }

    markers.sort((a, b) => {
        return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0);
    });
    allMarkers = allMarkers.concat(markers);

    $("#start").empty();
    $("#end").empty();
    for (const m of allMarkers) {
        let option = document.createElement("option");
        option.text = m.title;
        option.value = m.position.lat() + "," + m.position.lng();
        $("#start").append(option);
        $("#end").append(option.cloneNode(true));
    }
}

function displayStreet(placePosition) {
    panorama = map.getStreetView();
    panorama.setPosition(placePosition);
    panorama.setPov({
        heading: 265,
        pitch: 0
    });

    if (panorama.getVisible() == false) {
        panorama.setVisible(true);
    } else {
        panorama.setVisible(false);
    }
}