// Récupérer l'ID de l'utilisateur à partir de l'URL
var userId = getParameterByName('userId');

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

document.addEventListener('DOMContentLoaded', () => {
    const pp = document.getElementById("pp");
    const name = document.getElementById("name");
    const publi = document.getElementById("publi");
    const follow = document.getElementById("follow");
    const descr = document.getElementById("desc");

    firebase.auth().onAuthStateChanged((user) => {
        let userId = user.uid;
        let ref = firebase.database().ref("users/" + userId);

        ref.on('value', (snapshot) => {
            let data = snapshot.val();
            if (data) {
                let nom = data.name;
                let public = data.posts;
                let fol = data.followers;
                let desc = data.desc;

                let storageRef = firebase.storage().ref();
                let imageRef = storageRef.child('defaultpp.svg');

                imageRef.getDownloadURL().then((url) => {
                    // Utilisez l'URL de téléchargement ici
                    pp.src = url
                }).catch((error) => {
                    console.error('Erreur lors de la récupération de l\'URL de téléchargement de l\'image :', error);
                });

                name.innerHTML = nom;
                publi.innerHTML = public + "publications";
                follow.innerHTML = fol;
                descr.innerHTML = desc;

            }
        })
    })
})