const npxPlugins = Plugins.Capacitor();

const takePicture = async (pid) => {
    const image = await npxPlugins.Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: npxPlugins.CameraResultType.Base64
    });

    let ref = firebase.database().ref("users/" + userId + '/' + pid);

    let currentId = firebase.auth().currentUser.uid;

    let storageRef = firebase.storage().ref().child('users/' + currentId + '/' + pid);
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

        const ref = firebase.database().ref("users/" + userId + '/' + pid);
        
        const publication = document.getElementById('publier');
        const plat = document.getElementById("plat");
        const avis = document.querySelector("textarea");
        let photoPrise = 0;

        publication.addEventListener("click", () => {

            if (plat.value && note != 0) {
                
                ref.set({
                    // restaurant: "",
                    plat: plat.value,
                    avis: avis.value,
                    photo: photoPrise,
                    note: note
                })
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

        document.getElementById("photo").addEventListener("click", () => {
            photoPrise = 1;
            takePicture(pid);
        })
    });
});
