const npxPlugins = Plugins.Capacitor();

// Récupérer l'ID de l'utilisateur à partir de l'URL
const getProfileUid = (name, url) => {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const userId = getProfileUid('userId');

const takePicture = async () => {
    const image = await npxPlugins.Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: npxPlugins.CameraResultType.Base64
    });

    let ref = firebase.database().ref("users/" + userId);

    let currentId = firebase.auth().currentUser.uid;

    let storageRef = firebase.storage().ref().child('users/' + currentId + '/' + currentId);

    let imageb64 = image.base64String;

    let uploadTask = storageRef.putString('data:image/jpg;base64,' + imageb64, 'data_url');

    uploadTask.on('state_changed',
        (snapshot) => {
            // Suivi de la progression du téléchargement ici (optionnel)
        },
        (error) => {
            // Gestion des erreurs de téléchargement ici
        },
        () => {
            // Le téléchargement est terminé avec succès
            ref.once("value", (snapshot) => {
                ref.update({
                    defaultpp: 0
                })
            })
            let imageRef = storageRef.child('users/' + userId + '/' + userId);
            imageRef.getDownloadURL().then((url) => {
                // Utilisez l'URL de téléchargement ici
                pp.style.backgroundImage = "url(" + url + ")";
            })
        });
};

const getUserData = (uid) => {
    const pp = document.getElementById("pp");
    const ppEdit = document.getElementById("ppEdit");
    const name = document.getElementById("name");
    const publi = document.getElementById("publi");
    const follow = document.getElementById("follow");
    const descr = document.getElementById("desc");
    const ref = firebase.database().ref("users/" + uid);

    ref.on('value', (snapshot) => {
        let data = snapshot.val();
        if (data) {
            let nom = data.name;
            let public = data.nbPosts;
            let fol = data.followers;
            let desc = data.desc;

            let storageRef = firebase.storage().ref();
            let imageRef = storageRef.child('users/' + userId + '/' + userId);
            let defaultImgRef = storageRef.child('defaultpp.svg');

            ref.on('value', (snapshot) => {
                let data = snapshot.val();

                if (data.defaultpp == 1) {
                    defaultImgRef.getDownloadURL().then((url) => {
                        // Utilisez l'URL de téléchargement ici
                        pp.style.backgroundImage = "url(" + url + ")";
                        ppEdit.style.backgroundImage = "url(" + url + ")";

                    }).catch((error) => {
                        console.error('Erreur lors de la récupération de l\'URL de téléchargement de l\'image :', error);
                    });
                }
                else {
                    imageRef.getDownloadURL().then((url) => {
                        // Utilisez l'URL de téléchargement ici
                        pp.style.backgroundImage = "url(" + url + ")";
                        ppEdit.style.backgroundImage = "url(" + url + ")";
                    }).catch((error) => {
                        console.error('Erreur lors de la récupération de l\'URL de téléchargement de l\'image :', error);
                    });
                }
            })

            const elements = document.getElementById('ppContainer').querySelectorAll(".skeleton");

            elements.forEach(element => {
                element.classList.remove('skeleton', 'skeleton-text');
            });

            document.getElementById('desc').classList.remove('skeleton', 'skeleton-text')
            name.innerHTML = nom;
            publi.innerHTML = public + " publications";
            follow.innerHTML = fol + " followers";
            descr.innerHTML = desc;

            document.getElementById('editNom').value = nom;
            document.getElementById('editDescr').value = desc;
        }
    });
}

const getPosts = () => {
    const container = document.getElementById("postsContainer");

    let ref = firebase.database().ref("users/" + userId + '/posts/');

    ref.once('value')
        .then((snapshot) => {
            if (snapshot.val() === null) {
                let noPost = document.createElement('p');
                noPost.classList.add('noPost');
                noPost.textContent = "Aucun post pour le moment...";
                container.appendChild(noPost);
            } 
            else {
                snapshot.forEach((post) => {
                    const id = post.key;
                    const data = post.val();

                    let postContainer = document.createElement('div');
                    postContainer.classList.add('post');
                    container.appendChild(postContainer);

                    let postContent = `
                    <h3>${data.restaurant}</h3>
                    `;

                    postContainer.innerHTML = postContent;
                });
            }
        })
        .catch((error) => {
            console.error('Erreur lors de la lecture du dossier :', error);
        });
}


document.addEventListener('DOMContentLoaded', () => {
    const editNom = document.getElementById('editNom');
    const editDescr = document.getElementById('editDescr');
    const btnEditNom = document.getElementById('editName');
    const btnEditDesc = document.getElementById('editDesc');
    const editPanel = document.getElementById('editPanel');
    const ref = firebase.database().ref("users/" + getProfileUid('userId'));

    firebase.auth().onAuthStateChanged((user) => {
        let currentUserId = user.uid;

        if (currentUserId == userId) {
            getUserData(currentUserId);
            document.getElementById("btnContainer").style.display = "flex";
        }
        else {
            getUserData(userId);
            editPanel.style.display = "none";
            document.getElementById('btnFollow').style.display = 'block';
        }

        getPosts();
    })

    document.getElementById('edit').addEventListener("click", () => {
        editPanel.classList.add('activePanel');
    });

    document.getElementById('back').addEventListener('click', () => {
        editPanel.classList.remove('activePanel');
    });

    editNom.addEventListener('input', () => {
        let val = editNom.value;
        if (val.length >= 1) {
            document.getElementById('editName').style.display = "block";
        }
        else {
            document.getElementById('editName').style.display = "none";
        }
    });

    editDescr.addEventListener('input', () => {
        let val = editDescr.value;
        if (val.length >= 1) {
            document.getElementById('editDesc').style.display = "block";
        }
        else {
            document.getElementById('editDesc').style.display = "none";
        }
    });

    btnEditNom.addEventListener('click', () => {
        let newName = editNom.value;
        ref.update({
            name: newName
        }).then(() => {
            document.querySelector("#editPanel p").style.color = "green";
            document.querySelector("#editPanel p").textContent = "Nom modifié avec succès !";
        })
            .catch((error) => {
                document.querySelector("#editPanel p").style.color = "red";
                document.querySelector("#editPanel p").textContent = "Une erreur est survenue lors de la modification";
                // une erreur est survenue
            });
    })

    btnEditDesc.addEventListener('click', () => {
        let newDesc = editDescr.value;
        ref.update({
            desc: newDesc
        }).then(() => {
            document.querySelector("#editPanel p").style.color = "green";
            document.querySelector("#editPanel p").textContent = "Bio modifiée avec succès !";
        })
            .catch((error) => {
                document.querySelector("#editPanel p").style.color = "red";
                document.querySelector("#editPanel p").textContent = "Une erreur est survenue lors de la modification";
                // une erreur est survenue
            });
    })

    document.querySelector('#ppEditContainer button').addEventListener('click', () => {
        takePicture();
    })

    const login = document.getElementById("login");
    const password = document.getElementById("password");
    const mail = document.getElementById("mail");
    const logPassword = document.getElementById("logPassword");
    const pConfirm = document.querySelector('#connexion p');

    document.getElementById("btnLogOut").addEventListener('click', () => {
        document.querySelector("#connexion p").textContent = "";
        login.value = "";
        password.value = "";
        mail.value = "";
        logPassword.value = "";
        pConfirm.style.display = "none";
        firebase.auth().signOut();
    });
})