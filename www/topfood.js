const npxPlugins = Plugins.Capacitor();

document.addEventListener('DOMContentLoaded', function () {

    const profile = document.getElementById("profile");

    profile.addEventListener('click', function (event) {
        // Récupérer l'ID de l'utilisateur à partir de l'élément cliqué
        let userId = firebase.auth().currentUser.uid;
        console.log(userId);

        // Rediriger vers la page du profil de l'utilisateur en passant l'ID dans l'URL
        window.location.href = 'profil.html?userId=' + userId;
    });
});