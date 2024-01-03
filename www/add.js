//Fonction permettant la prise de photo
const takePicture = async (pid) => {
    const image = await npxPlugins.Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: npxPlugins.CameraResultType.Base64
    });

    return image.base64String;
}

let autocomplete;
let restaurant;
let note = 0;
let platEcrit = 0;
let desac;
let lieu;

//Inistialisation de l'autocomplétion google places
function initAutocomplete() {
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('autocomplete'),
        {
            types: ['restaurant'],
            componentRestrictions: { 'country': ['FR'] },
            fields: ['place_id', 'geometry', 'name']
        });

    autocomplete.addListener('place_changed', onPlaceChanged);
}

//Sélection d'un lieu
const onPlaceChanged = () => {
    var place = autocomplete.getPlace();

    if (!place.geometry) {
        document.getElementById('autocomplete').placeholder =
            'Rechercher un restaurant';
    } else {
        let adresse = `https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat()},${place.geometry.location.lng()}&query_place_id=${place.place_id}`;
        restaurant = `<a href="${adresse}" target="_blank">${place.name}</a>`;
        lieu = place.name;
        let detailsElement = document.getElementById('details');
        detailsElement.classList.remove('details');
        detailsElement.innerHTML = restaurant;

        if (platEcrit != 0 && note != 0) {
            desac();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {

    firebase.auth().onAuthStateChanged(async user => {
        const userId = user.uid;

        const stars = document.querySelectorAll('.star');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const starIndex = star.getAttribute('nb');

                stars.forEach(star => {
                    star.classList.remove('active');
                });

                // Mettre en surbrillance l'étoile cliquée et toutes les étoiles précédentes
                for (let i = 1; i <= starIndex; i++) {
                    const currentStar = document.querySelector(`.star[nb="${i}"]`);
                    currentStar.classList.add('active');
                }

                note = starIndex;

                if (plat.innerText && note != 0 && restaurant) {
                    publication.classList.remove('desac');
                }
                else if (plat.innerText && note != 0) {
                    platEcrit = 1;
                }
            });
        });

        const pid = userId + Date.now();

        const ref = firebase.database().ref("users/" + userId + '/posts/' + pid);
        const ref2 = firebase.database().ref("users/" + userId + '/nbPosts');
        const ref3 = firebase.database().ref("users/" + userId + '/plats');

        const publication = document.getElementById('publier');
        const plat = document.getElementById("detailsPlat");
        const avis = document.querySelector("textarea");
        let photoPrise = 0;
        let image;

        desac = () => {
            publication.classList.remove('desac');
        }

        document.getElementById("photo").addEventListener("click", async () => {
            image = await takePicture(pid);
            photoPrise = 1;
            document.querySelector('#publication img').src = 'data:image/jpg;base64,' + image;
        })

        publication.addEventListener("click", () => {

            if (plat.innerText && note !== 0 && restaurant) {

                if (photoPrise == 1) {

                    let storageRef = firebase.storage().ref().child('users/' + userId + '/posts/' + pid);
                    let uploadTask = storageRef.putString('data:image/jpg;base64,' + image, 'data_url');

                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            // Vous pouvez ajouter des logiques ici pour suivre la progression du téléchargement
                        },
                        (error) => {
                            console.error('Erreur lors du téléchargement de l\'image :', error);
                        },
                        () => {
                            // Le téléchargement est terminé, vous pouvez exécuter des actions supplémentaires ici si nécessaire
                            ref.set({
                                restaurant: restaurant,
                                plat: plat.innerText,
                                avis: avis.value,
                                photo: photoPrise,
                                note: note,
                                date: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`
                            })

                            ref2.transaction((val) => {
                                return val + 1;
                            })

                            ref3.transaction((val) => {
                                if (val) {
                                    return val + `${plat.innerText},`;
                                }
                                else {
                                    return `${plat.innerText},`;
                                }
                            });

                            const ref4 = firebase.database().ref("users/" + userId + '/restoNote/' + plat.innerText);

                            ref4.child(lieu).set({note : note, lien : restaurant});

                            window.location.href = 'profil.html?userId=' + userId;
                        }
                    );
                }

                else {
                    ref.set({
                        restaurant: restaurant,
                        plat: plat.innerText,
                        avis: avis.value,
                        photo: photoPrise,
                        note: note,
                        date: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`
                    })

                    ref2.transaction((val) => {
                        return val + 1;
                    });

                    ref3.transaction((val) => {
                        if (val) {
                            return val + `${plat.innerText},`;
                        }
                        else {
                            return `${plat.innerText},`;
                        }
                    });

                    const ref4 = firebase.database().ref("users/" + userId + '/restoNote/' + plat.innerText);

                    ref4.child(lieu).set({note : note, lien : restaurant});

                    window.location.href = 'profil.html?userId=' + userId;
                }
            }
        })

        let searchPlat = document.getElementById('search-input');
        let resultsContainer = document.getElementById('results-container');
        let detailsPlat = document.getElementById('detailsPlat');
    
        let plats = await firebase.database().ref(`plats`).once('value');
        
        const dataPlats = plats.val().split(',');
    
        // Fonction pour afficher les résultats
        const showResults = (results) => {
            resultsContainer.innerHTML = '';
    
            if (results.length === 0) {
                resultsContainer.style.display = 'none';
                return;
            }
    
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.textContent = result;
    
                resultItem.addEventListener('click', () => {
                    searchPlat.value = result;
                    resultsContainer.style.display = 'none';
                    detailsPlat.innerHTML = result;
    
                    if (plat.innerText && note != 0 && restaurant) {
                        publication.classList.remove('desac');
                    }
                    else if (plat.innerText && note != 0) {
                        platEcrit = 1;
                    }
                    else if (!plat.innerText) {
                        publication.classList.add('desac');
                        platEcrit = 0;
                    }
                });
    
                resultsContainer.appendChild(resultItem);
            });
    
            resultsContainer.style.display = 'block';
        }
    
        // Gérer les événements de saisie
        searchPlat.addEventListener('input', () => {
            const inputValue = searchPlat.value.toLowerCase();
            const filteredResults = dataPlats.filter(result => result.toLowerCase().includes(inputValue));
            showResults(filteredResults);
    
            if (searchPlat.value === '') {
                resultsContainer.style.display = "none";
            }
        });
    
        // Gérer les événements de clic en dehors du conteneur de résultats pour le fermer
        document.addEventListener('click', (event) => {
            if (!resultsContainer.contains(event.target) && event.target !== searchPlat) {
                resultsContainer.style.display = 'none';
            }
        });
    
        searchPlat.addEventListener('click', () => {
            if (searchPlat.value.trim() !== '') {
              const inputValue = searchPlat.value.toLowerCase();
              const filteredResults = dataPlats.filter(result => result.toLowerCase().includes(inputValue));
              showResults(filteredResults);
            }
          });
    });
});
