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
                pp.src = url;
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
                        pp.src = url;
                        ppEdit.src = url;

                    }).catch((error) => {
                        console.error('Erreur lors de la récupération de l\'URL de téléchargement de l\'image :', error);
                    });
                }
                else {
                    imageRef.getDownloadURL().then((url) => {
                        // Utilisez l'URL de téléchargement ici
                        pp.src = url;
                        ppEdit.src = url;
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

const getPosts = async () => {
    const container = document.getElementById("postsContainer");

    let ref = firebase.database().ref("users/" + userId + '/posts/');

    try {
        const snapshot = await ref.once('value');
        const data = snapshot.val();

        if (data === null) {
            document.getElementById('skPost').style.display = "none";
            let noPost = document.createElement('p');
            noPost.classList.add('noPost');
            noPost.textContent = "Aucun post pour le moment...";
            container.appendChild(noPost);
        } else {
            Object.keys(data).forEach(async (postKey) => {
                const post = data[postKey];
                let postContainer = document.createElement('div');
                let postContent;

                if (post.photo == 1) {
                    try {
                        const imgPost = await getImg(postKey);
                        postContainer.classList.add('post');
                        container.appendChild(postContainer);

                        let userPPName = await getUserPost(postKey);

                        postContent = `

                            <img src='${imgPost}'>
                            <div class='postTxt'>
                                <div class='ppName'>
                                    ${userPPName}
                                 </div>
                                <h3>${post.restaurant}</h3>
                                <button class="deleteBtn" onclick="deletePost('${postKey}')"></button>
                                <h4>${post.plat} : <span class='note'>${post.note} <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 617" width="15" height="15"><title>stars-svg</title><style>.s0 { fill: #0099ff; transform: translateY(10%) } </style><g id="Layer"><path id="Layer" fill-rule="evenodd" class="s0" d="m318.6 7.3c-8.8 3.1-12.1 6.7-19.7 21-3.9 7.2-22.1 43.3-40.7 80.3-36.1 72.1-37.3 74.2-46.8 78.6-3.5 1.7-23.2 4.7-93.9 14.8-84.7 12.1-89.8 12.9-95.7 15.7-10.7 5.3-16.8 16.3-15.6 28.6 1 11 0.6 10.6 59 66.3 83.7 79.9 79.9 75.9 82.1 86.4 0.9 4.3-0.6 13.9-14.3 92.2-11.7 67-15.2 88.6-14.8 92.9 0.8 9.9 6.9 18.6 16.2 23.1 4.8 2.4 6.7 2.8 13.9 2.8h8.4l78.9-40.8c43.4-22.4 80.9-41.5 83.5-42.4 2.4-0.9 7-1.7 9.9-1.7 2.9 0 7.5 0.8 9.9 1.7 2.6 0.9 40.1 20 83.5 42.4l78.9 40.8h8.4c7.2 0 9.1-0.4 13.9-2.8 9.3-4.5 15.4-13.2 16.2-23.1 0.4-4.3-3.1-25.9-14.8-92.9-13.7-78.3-15.2-87.9-14.3-92.2 2.2-10.5-1.6-6.5 82.1-86.4 58.4-55.7 58-55.3 59-66.3 1.2-12.3-4.9-23.3-15.6-28.6-5.9-2.8-11-3.6-95.7-15.7-70.7-10.1-90.4-13.1-93.9-14.8-9.5-4.4-10.3-5.7-52.8-90.3-42.5-84.6-42.4-84.5-51.9-88.7-6.4-2.8-16.8-3.3-23.3-0.9z"/></g></svg>
                                </span></h4>
                                <p>${post.avis}<p>
                                <p class='date'>Posté le ${post.date}</p>
                            </div>
                        `;
                    } catch (error) {
                        console.error('Erreur lors de la récupération de l\'image :', error);
                    }
                } else {
                    postContainer.classList.add('post', 'noImgPost');
                    container.appendChild(postContainer);

                    postContent = `
                    <div class='postTxt zeroImg'>
                        <h3>${post.restaurant}</h3>
                        <button class="deleteBtn" onclick="deletePost('${postKey}')"></button>
                        <h4>${post.plat} : <span class='note'>${post.note} <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 617" width="15" height="15"><title>stars-svg</title><style>.s0 { fill: #0099ff; transform: translateY(10%) } </style><g id="Layer"><path id="Layer" fill-rule="evenodd" class="s0" d="m318.6 7.3c-8.8 3.1-12.1 6.7-19.7 21-3.9 7.2-22.1 43.3-40.7 80.3-36.1 72.1-37.3 74.2-46.8 78.6-3.5 1.7-23.2 4.7-93.9 14.8-84.7 12.1-89.8 12.9-95.7 15.7-10.7 5.3-16.8 16.3-15.6 28.6 1 11 0.6 10.6 59 66.3 83.7 79.9 79.9 75.9 82.1 86.4 0.9 4.3-0.6 13.9-14.3 92.2-11.7 67-15.2 88.6-14.8 92.9 0.8 9.9 6.9 18.6 16.2 23.1 4.8 2.4 6.7 2.8 13.9 2.8h8.4l78.9-40.8c43.4-22.4 80.9-41.5 83.5-42.4 2.4-0.9 7-1.7 9.9-1.7 2.9 0 7.5 0.8 9.9 1.7 2.6 0.9 40.1 20 83.5 42.4l78.9 40.8h8.4c7.2 0 9.1-0.4 13.9-2.8 9.3-4.5 15.4-13.2 16.2-23.1 0.4-4.3-3.1-25.9-14.8-92.9-13.7-78.3-15.2-87.9-14.3-92.2 2.2-10.5-1.6-6.5 82.1-86.4 58.4-55.7 58-55.3 59-66.3 1.2-12.3-4.9-23.3-15.6-28.6-5.9-2.8-11-3.6-95.7-15.7-70.7-10.1-90.4-13.1-93.9-14.8-9.5-4.4-10.3-5.7-52.8-90.3-42.5-84.6-42.4-84.5-51.9-88.7-6.4-2.8-16.8-3.3-23.3-0.9z"/></g></svg>
                        </span></h4>
                        <p>${post.avis}<p>
                        <p class='date'>Posté le ${post.date}</p>
                    </div>
                `;
                }
                document.getElementById('skPost').style.display = "none";
                postContainer.innerHTML = postContent;
            });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
    }
};

const getUserPost = async (postKey) => {
    return new Promise((resolve, reject) => {
        let idUserPost = postKey.slice(0, 28);

        let ref = firebase.database().ref("users/" + idUserPost);

        let storageRef = firebase.storage().ref();
        let imageRef = storageRef.child('users/' + idUserPost + '/' + idUserPost);
        let defaultImgRef = storageRef.child('defaultpp.svg');

        ref.once("value").then((snapshot) => {
            const data = snapshot.val();
            let res;

            if (data.defaultpp == 1) {
                defaultImgRef.getDownloadURL().then((url) => {
                    // Utilisez l'URL de téléchargement ici
                    res = `
                    <a href='./profil.html?userId=${idUserPost}'><img src='${url}'></a>
                    <a href='./profil.html?userId=${idUserPost}'>${data.name}</a>
                    `;
                    resolve(res);
                }).catch((error) => {
                    console.error('Erreur lors de la récupération de l\'URL de téléchargement de l\'image :', error);
                });
            }
            else {
                imageRef.getDownloadURL().then((url) => {
                    // Utilisez l'URL de téléchargement ici
                    res = `
                    <a href='./profil.html?userId=${idUserPost}'><img src='${url}'></a>
                    <a href='./profil.html?userId=${idUserPost}'>${data.name}</a>
                    `;
                    resolve(res);
                }).catch((error) => {
                    console.error('Erreur lors de la récupération de l\'URL de téléchargement de l\'image :', error);
                });
            }

        })
    })
}

const getImg = async (id) => {
    return new Promise((resolve, reject) => {
        let storageRef = firebase.storage().ref();
        let imageRef = storageRef.child('users/' + userId + '/posts/' + id);

        imageRef.getDownloadURL()
            .then((url) => {
                resolve(url);
            })
            .catch((error) => {
                reject(error);
            });
    })
}

const deletePost = (postId) => {

    const ref = firebase.database().ref("users/" + userId + "/posts/" + postId);
    const ref2 = firebase.database().ref("users/" + userId + '/nbPosts');
    const storageRef = firebase.storage().ref().child("users/" + userId + "/posts/" + postId);

    ref.once('value')
        .then((snapshot) => {
            let data = snapshot.val();

            if (data.photo == 1) {
                ref.remove()
                    .then(() => {
                        storageRef.delete()
                            .then(() => {
                                ref2.transaction((val) => {
                                    return val - 1;
                                })
                                window.location.href = 'profil.html?userId=' + userId;
                            })
                    })
                    .catch((error) => {
                        console.error("Erreur lors de la suppression de l'élément :", error);
                    });
            }

            else {
                ref.remove()
                    .then(() => {
                        ref2.transaction((val) => {
                            return val - 1;
                        })
                        window.location.href = 'profil.html?userId=' + userId;
                    })
                    .catch((error) => {
                        console.error("Erreur lors de la suppression de l'élément :", error);
                    });
            }
        })
};

const follow = (id) => {

    const usersRef = firebase.database().ref(`users/${firebase.auth().currentUser.uid}`);

    const ref2 = firebase.database().ref("users/" + id + '/followers');

    usersRef.once('value', (snapshot) => {
        let currentFollows = snapshot.val().followed || ""; // Assurez-vous d'avoir une chaîne vide si la valeur est null

        // Si l'élément a déjà la classe 'followed', cela signifie que l'utilisateur veut arrêter de suivre
        if (document.getElementById("btnFollow").classList.contains("followed")) {
            // Retirez l'ID de la liste
            currentFollows = currentFollows.split(',').filter(item => item !== id).join(',');
        
            usersRef.update({ followed: currentFollows });
        
            ref2.transaction((val) => {
                return Math.max(val - 1, 0); // Décrémentez d'au plus 1, mais ne descendez jamais en dessous de zéro
            })
        
            document.getElementById("btnFollow").classList.remove("followed");
            document.getElementById("btnFollow").innerText = "Suivre";
        } else {
            // Vérifiez si la valeur est déjà présente avant de l'ajouter
            if (!currentFollows.includes(id)) {
                if (currentFollows !== "") {
                    currentFollows += ",";
                }
                currentFollows += id;

                ref2.transaction((val) => {
                    return val + 1;
                })

                usersRef.update({ followed: currentFollows });
                document.getElementById("btnFollow").classList.add("followed");
                document.getElementById("btnFollow").innerText = "Suivi(e)";
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const editNom = document.getElementById('editNom');
    const editDescr = document.getElementById('editDescr');
    const btnEditNom = document.getElementById('editName');
    const btnEditDesc = document.getElementById('editDesc');
    const editPanel = document.getElementById('editPanel');
    const ref = firebase.database().ref("users/" + getProfileUid('userId'));

    firebase.auth().onAuthStateChanged(async (user) => {
        let currentUserId = user.uid;

        if (currentUserId == userId) {
            getUserData(currentUserId);
            document.getElementById("btnContainer").style.display = "flex";
        }
        else {
            getUserData(userId);
            editPanel.style.display = "none";

            const btnFollow = document.getElementById('btnFollow');
            const userRef = firebase.database().ref(`users/${firebase.auth().currentUser.uid}`)

            userRef.once('value', async (snapshot) => {

                let data = snapshot.val();
                let followed = data.followed.split(',');

                if (followed.includes(userId)) {
                    btnFollow.classList.add('followed');
                    btnFollow.innerText = "Suivi(e)";
                }
    
                btnFollow.style.display = 'block';
                btnFollow.onclick = () => {
                    follow(userId);
                };
            })
        }

        await getPosts();
    })

    document.getElementById('edit').addEventListener("click", () => {
        editPanel.classList.add('activePanel');
        document.querySelector("html").style.overflowY = 'hidden';
    });

    document.getElementById('back').addEventListener('click', () => {
        editPanel.classList.remove('activePanel');
        document.querySelector("html").style.overflowY = 'auto';
    });

    document.getElementById("enregistrer").addEventListener("click", () => {
        let newName = editNom.value;
        ref.update({
            name: newName
        }).then(() => {
            let newDesc = editDescr.value;
            ref.update({
                desc: newDesc
            }).then(() => {
                editPanel.classList.remove('activePanel');
                document.querySelector("html").style.overflowY = 'auto';
            })
                .catch((error) => {
                    // une erreur est survenue
                });
        })
            .catch((error) => {

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