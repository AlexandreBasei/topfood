const npxPlugins = Plugins.Capacitor();

const takePicture = async (pid) => {
    const image = await npxPlugins.Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: npxPlugins.CameraResultType.Base64
    });

    return image.base64String;
}

document.addEventListener('DOMContentLoaded', () => {

    firebase.auth().onAuthStateChanged(user => {
        const userId = user.uid;

        const stars = document.querySelectorAll('.star');

        let note = 0;

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

                if (plat.value && note !=0) {
                    publication.classList.remove('desac');
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

        document.getElementById("photo").addEventListener("click", async () => {
            image = await takePicture(pid);
            photoPrise = 1;
            document.querySelector('#publication img').src = 'data:image/jpg;base64,' + image;
        })

        publication.addEventListener("click", () => {

            if (plat.value && note != 0) {
                
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
                                // restaurant: "",
                                plat: plat.value,
                                avis: avis.value,
                                photo: photoPrise,
                                note: note
                            })
            
                            ref2.transaction( (val) => {
                                return val+1;
                            })
            
                            window.location.href = 'profil.html?userId=' + userId;
                        }
                    );
                }

                else{
                    ref.set({
                        restaurant: "Paris New York",
                        plat: plat.value,
                        avis: avis.value,
                        photo: photoPrise,
                        note: note
                    })
    
                    ref2.transaction( (val) => {
                        return val+1;
                    })
    
                    window.location.href = 'profil.html?userId=' + userId;
                }
            }
        })

        plat.addEventListener('input', () => {
            if (plat.value && note !=0) {
                publication.classList.remove('desac');
            }
            else if (!plat.value){
                publication.classList.add('desac');
            }
        })
    });
});
