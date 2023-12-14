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

//Inistialisation de l'autocomplétion google places
function initAutocomplete () {
  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById('autocomplete'),
    {
      types: ['restaurant'],
      componentRestrictions: {'country' : ['FR']},
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
    let adresse = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
    restaurant = `<a href="${adresse}" target="_blank">${place.name}</a>`;
    let detailsElement = document.getElementById('details');
    detailsElement.classList.remove('details');
    detailsElement.innerHTML = restaurant;
    console.log(platEcrit);
    
    if (platEcrit != 0 && note != 0) {
        console.log("dzad");
        desac();
    }
  }
}

//Sélection de la position actuelle de l'utilisateur
// const getCurrentLocation = () => {
//   if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         var detailsElement = document.getElementById('details');
//         adresse = `https://www.google.com/maps/search/?api=1&query=${position.coords.latitude},${position.coords.longitude}`;
//         detailsElement.innerHTML = `<p>Votre position</p>`;
//       },
//       (error) => {
//         console.error('Error getting current location:', error);
//       }
//     );
//   } else {
//     alert('Géolocalisation non supportée par votre appareil');
//   }
// }

document.addEventListener('DOMContentLoaded', () => {

    firebase.auth().onAuthStateChanged(user => {
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

                if (plat.value && note != 0 && restaurant) {
                    publication.classList.remove('desac');
                }
                else if (plat.value && note!= 0) {
                    platEcrit = 1;
                }
            });
        });

        const pid = userId + Date.now();

        const ref = firebase.database().ref("users/" + userId + '/posts/' + pid);
        const ref2 = firebase.database().ref("users/" + userId + '/nbPosts');

        const publication = document.getElementById('publier');
        const plat = document.getElementById("plat");
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

            if (plat.value && note != 0 && restaurant) {

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
                                plat: plat.value,
                                avis: avis.value,
                                photo: photoPrise,
                                note: note,
                                date: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`
                            })

                            ref2.transaction((val) => {
                                return val + 1;
                            })

                            window.location.href = 'profil.html?userId=' + userId;
                        }
                    );
                }

                else {
                    ref.set({
                        restaurant: restaurant,
                        plat: plat.value,
                        avis: avis.value,
                        photo: photoPrise,
                        note: note,
                        date: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`
                    })

                    ref2.transaction((val) => {
                        return val + 1;
                    })

                    window.location.href = 'profil.html?userId=' + userId;
                }
            }
        })

        plat.addEventListener('input', () => {
            if (plat.value && note != 0 && restaurant) {
                publication.classList.remove('desac');
            }
            else if (plat.value && note!=0) {
                platEcrit = 1;
            }
            else if (!plat.value) {
                console.log('nno');
                publication.classList.add('desac');
                platEcrit = 0;
            }

            console.log(platEcrit);
        })
    });
});
