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
    const suivis = document.getElementById("suivi");
    const descr = document.getElementById("desc");
    const ref = firebase.database().ref("users/" + uid);

    ref.on('value', (snapshot) => {
        let data = snapshot.val();
        if (data) {
            let nom = data.name;
            let public = data.nbPosts;
            let nbFollowers = data.nbFollowers;
            let nbFollowed = data.nbFollowed;
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
            document.getElementById("vosPubli").style.display = "block";
            document.getElementById("vosPubli").innerText = "Publications";
            name.innerHTML = nom;
            publi.innerHTML = public + " Publications";
            follow.innerHTML = nbFollowers + " Followers";
            suivis.innerHTML = nbFollowed + " Suivi(e)s";
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

                        let like = await getLike(postKey);

                        if (firebase.auth().currentUser.uid === userId) {
                            postContent = `
                            <button class="deleteModal" onclick="deleteModal('${postKey}')"></button>
                            <div class="modal" id="${postKey}">
                                <div onclick="deletePost('${postKey}')">Supprimer</div>
                            </div>
                            <div class='ppName'>
                                ${userPPName}
                            </div>
                            <img src='${imgPost}'>
                            <div class='postTxt'>
                                <h3>${post.restaurant}</h3>
                                <div class="noteContainer">
                                <h4>${post.plat} :</h4><h4 class="note">${post.note} <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 617" width="15" height="15"><title>stars-svg</title><style>.s0 { fill: #0099ff; transform: translateY(10%) } </style><g id="Layer"><path id="Layer" fill-rule="evenodd" class="s0" d="m318.6 7.3c-8.8 3.1-12.1 6.7-19.7 21-3.9 7.2-22.1 43.3-40.7 80.3-36.1 72.1-37.3 74.2-46.8 78.6-3.5 1.7-23.2 4.7-93.9 14.8-84.7 12.1-89.8 12.9-95.7 15.7-10.7 5.3-16.8 16.3-15.6 28.6 1 11 0.6 10.6 59 66.3 83.7 79.9 79.9 75.9 82.1 86.4 0.9 4.3-0.6 13.9-14.3 92.2-11.7 67-15.2 88.6-14.8 92.9 0.8 9.9 6.9 18.6 16.2 23.1 4.8 2.4 6.7 2.8 13.9 2.8h8.4l78.9-40.8c43.4-22.4 80.9-41.5 83.5-42.4 2.4-0.9 7-1.7 9.9-1.7 2.9 0 7.5 0.8 9.9 1.7 2.6 0.9 40.1 20 83.5 42.4l78.9 40.8h8.4c7.2 0 9.1-0.4 13.9-2.8 9.3-4.5 15.4-13.2 16.2-23.1 0.4-4.3-3.1-25.9-14.8-92.9-13.7-78.3-15.2-87.9-14.3-92.2 2.2-10.5-1.6-6.5 82.1-86.4 58.4-55.7 58-55.3 59-66.3 1.2-12.3-4.9-23.3-15.6-28.6-5.9-2.8-11-3.6-95.7-15.7-70.7-10.1-90.4-13.1-93.9-14.8-9.5-4.4-10.3-5.7-52.8-90.3-42.5-84.6-42.4-84.5-51.9-88.7-6.4-2.8-16.8-3.3-23.3-0.9z"/></g></svg>
                                </h4>
                                </div>
                                <p>${post.avis}<p>
                                <p class='date'>Posté le ${post.date}</p>
                                ${like}
                            </div>
                        `;
                        }
                        else {
                            postContent = `
                            <div class='ppName'>
                                ${userPPName}
                            </div>
                            <img src='${imgPost}'>
                            <div class='postTxt'>
                                <h3>${post.restaurant}</h3>
                                <div class="noteContainer">
                                <h4>${post.plat} :</h4><h4 class="note">${post.note} <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 617" width="15" height="15"><title>stars-svg</title><style>.s0 { fill: #0099ff; transform: translateY(10%) } </style><g id="Layer"><path id="Layer" fill-rule="evenodd" class="s0" d="m318.6 7.3c-8.8 3.1-12.1 6.7-19.7 21-3.9 7.2-22.1 43.3-40.7 80.3-36.1 72.1-37.3 74.2-46.8 78.6-3.5 1.7-23.2 4.7-93.9 14.8-84.7 12.1-89.8 12.9-95.7 15.7-10.7 5.3-16.8 16.3-15.6 28.6 1 11 0.6 10.6 59 66.3 83.7 79.9 79.9 75.9 82.1 86.4 0.9 4.3-0.6 13.9-14.3 92.2-11.7 67-15.2 88.6-14.8 92.9 0.8 9.9 6.9 18.6 16.2 23.1 4.8 2.4 6.7 2.8 13.9 2.8h8.4l78.9-40.8c43.4-22.4 80.9-41.5 83.5-42.4 2.4-0.9 7-1.7 9.9-1.7 2.9 0 7.5 0.8 9.9 1.7 2.6 0.9 40.1 20 83.5 42.4l78.9 40.8h8.4c7.2 0 9.1-0.4 13.9-2.8 9.3-4.5 15.4-13.2 16.2-23.1 0.4-4.3-3.1-25.9-14.8-92.9-13.7-78.3-15.2-87.9-14.3-92.2 2.2-10.5-1.6-6.5 82.1-86.4 58.4-55.7 58-55.3 59-66.3 1.2-12.3-4.9-23.3-15.6-28.6-5.9-2.8-11-3.6-95.7-15.7-70.7-10.1-90.4-13.1-93.9-14.8-9.5-4.4-10.3-5.7-52.8-90.3-42.5-84.6-42.4-84.5-51.9-88.7-6.4-2.8-16.8-3.3-23.3-0.9z"/></g></svg>
                                </h4>
                                </div>
                                <p>${post.avis}<p>
                                <p class='date'>Posté le ${post.date}</p>
                                ${like}
                            </div>
                        `;
                        }
                    } catch (error) {
                        console.error('Erreur lors de la récupération de l\'image :', error);
                    }
                } else {
                    postContainer.classList.add('post', 'noImgPost');
                    container.appendChild(postContainer);

                    let userPPName = await getUserPost(postKey);

                    let like = await getLike(postKey);

                    if (firebase.auth().currentUser.uid === userId) {
                        postContent = `
                        <button class="deleteModal" onclick="deleteModal('${postKey}')"></button>
                        <div class="modal" id="${postKey}">
                            <div onclick="deletePost('${postKey}')">Supprimer</div>
                        </div>
                        <div class='ppName'>
                            ${userPPName}
                        </div>
                        <div class='postTxt zeroImg'>
                            <h3>${post.restaurant}</h3>
                            <div class="noteContainer">
                            <h4>${post.plat} :</h4><h4 class="note">${post.note} <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 617" width="15" height="15"><title>stars-svg</title><style>.s0 { fill: #0099ff; transform: translateY(10%) } </style><g id="Layer"><path id="Layer" fill-rule="evenodd" class="s0" d="m318.6 7.3c-8.8 3.1-12.1 6.7-19.7 21-3.9 7.2-22.1 43.3-40.7 80.3-36.1 72.1-37.3 74.2-46.8 78.6-3.5 1.7-23.2 4.7-93.9 14.8-84.7 12.1-89.8 12.9-95.7 15.7-10.7 5.3-16.8 16.3-15.6 28.6 1 11 0.6 10.6 59 66.3 83.7 79.9 79.9 75.9 82.1 86.4 0.9 4.3-0.6 13.9-14.3 92.2-11.7 67-15.2 88.6-14.8 92.9 0.8 9.9 6.9 18.6 16.2 23.1 4.8 2.4 6.7 2.8 13.9 2.8h8.4l78.9-40.8c43.4-22.4 80.9-41.5 83.5-42.4 2.4-0.9 7-1.7 9.9-1.7 2.9 0 7.5 0.8 9.9 1.7 2.6 0.9 40.1 20 83.5 42.4l78.9 40.8h8.4c7.2 0 9.1-0.4 13.9-2.8 9.3-4.5 15.4-13.2 16.2-23.1 0.4-4.3-3.1-25.9-14.8-92.9-13.7-78.3-15.2-87.9-14.3-92.2 2.2-10.5-1.6-6.5 82.1-86.4 58.4-55.7 58-55.3 59-66.3 1.2-12.3-4.9-23.3-15.6-28.6-5.9-2.8-11-3.6-95.7-15.7-70.7-10.1-90.4-13.1-93.9-14.8-9.5-4.4-10.3-5.7-52.8-90.3-42.5-84.6-42.4-84.5-51.9-88.7-6.4-2.8-16.8-3.3-23.3-0.9z"/></g></svg>
                            </h4>
                            </div>
                            <p>${post.avis}<p>
                            <p class='date'>Posté le ${post.date}</p>
                            ${like}
                        </div>
                    `;
                    }
                    else {
                        postContent = `
                        <div class='ppName'>
                            ${userPPName}
                        </div>
                        <div class='postTxt zeroImg'>
                            <h3>${post.restaurant}</h3>
                            <div class="noteContainer">
                            <h4>${post.plat} :</h4><h4 class="note">${post.note} <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 617" width="15" height="15"><title>stars-svg</title><style>.s0 { fill: #0099ff; transform: translateY(10%) } </style><g id="Layer"><path id="Layer" fill-rule="evenodd" class="s0" d="m318.6 7.3c-8.8 3.1-12.1 6.7-19.7 21-3.9 7.2-22.1 43.3-40.7 80.3-36.1 72.1-37.3 74.2-46.8 78.6-3.5 1.7-23.2 4.7-93.9 14.8-84.7 12.1-89.8 12.9-95.7 15.7-10.7 5.3-16.8 16.3-15.6 28.6 1 11 0.6 10.6 59 66.3 83.7 79.9 79.9 75.9 82.1 86.4 0.9 4.3-0.6 13.9-14.3 92.2-11.7 67-15.2 88.6-14.8 92.9 0.8 9.9 6.9 18.6 16.2 23.1 4.8 2.4 6.7 2.8 13.9 2.8h8.4l78.9-40.8c43.4-22.4 80.9-41.5 83.5-42.4 2.4-0.9 7-1.7 9.9-1.7 2.9 0 7.5 0.8 9.9 1.7 2.6 0.9 40.1 20 83.5 42.4l78.9 40.8h8.4c7.2 0 9.1-0.4 13.9-2.8 9.3-4.5 15.4-13.2 16.2-23.1 0.4-4.3-3.1-25.9-14.8-92.9-13.7-78.3-15.2-87.9-14.3-92.2 2.2-10.5-1.6-6.5 82.1-86.4 58.4-55.7 58-55.3 59-66.3 1.2-12.3-4.9-23.3-15.6-28.6-5.9-2.8-11-3.6-95.7-15.7-70.7-10.1-90.4-13.1-93.9-14.8-9.5-4.4-10.3-5.7-52.8-90.3-42.5-84.6-42.4-84.5-51.9-88.7-6.4-2.8-16.8-3.3-23.3-0.9z"/></g></svg>
                            </h4>
                            </div>
                            <p>${post.avis}<p>
                            <p class='date'>Posté le ${post.date}</p>
                            ${like}
                        </div>
                    `;
                    }
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

const getImgPP = async (id) => {
    return new Promise((resolve, reject) => {
        let storageRef = firebase.storage().ref();
        let imageRef = storageRef.child(`users/${id}/${id}`);

        imageRef.getDownloadURL()
            .then((url) => {
                resolve(url);
            })
            .catch((error) => {
                reject(error);
            });
    })
}

const getLike = async (postKey) => {
    let idUserPost = postKey.slice(0, 28);

    const snapshot = await firebase.database().ref(`users/${firebase.auth().currentUser.uid}`).once("value");

    let data = snapshot.val();
    let liked = data.liked;

    if (typeof liked === 'string') {
        liked = liked.split(',');
    } else {
        liked = [];
    }

    const snapshot2 = await firebase.database().ref(`postsLikes/${postKey}`).once("value");

    let data2 = snapshot2.val();

    let nbLikes;

    try {
        nbLikes = data2.likes;
    } catch (error) {
        nbLikes = 0;
    }


    if (!liked.includes(postKey)) {
        return `<button id="like${postKey}" class="like" onclick="like('${postKey}')"><svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>coeur-svg</title><style>.s1 { fill: #cacaca } </style><g id="_01_align_center"><path id="Layer" class="s1" d="m17.5 0.9q-0.8 0-1.7 0.3-0.8 0.2-1.5 0.6-0.7 0.5-1.3 1.1-0.6 0.6-1 1.3-0.4-0.7-1-1.3-0.6-0.6-1.3-1.1-0.7-0.4-1.5-0.6-0.9-0.3-1.7-0.3-1.3 0.1-2.6 0.6-1.2 0.6-2.1 1.6-0.9 1-1.4 2.3-0.4 1.2-0.4 2.6c0 6.7 11 14.6 11.4 14.9l0.6 0.4 0.6-0.4c0.4-0.3 11.4-8.2 11.4-14.9q0-1.4-0.4-2.6-0.5-1.3-1.4-2.3-0.9-1-2.1-1.6-1.3-0.5-2.6-0.6zm-5.5 19.9c-3.3-2.4-10-8.4-10-12.8q0-1 0.3-1.9 0.3-0.9 0.9-1.6 0.6-0.7 1.5-1.1 0.9-0.4 1.8-0.5 0.9 0.1 1.8 0.5 0.9 0.4 1.5 1.1 0.6 0.7 0.9 1.6 0.3 0.9 0.3 1.9h2q0-1 0.3-1.9 0.3-0.9 0.9-1.6 0.6-0.7 1.5-1.1 0.9-0.4 1.8-0.5 0.9 0.1 1.8 0.5 0.9 0.4 1.5 1.1 0.6 0.7 0.9 1.6 0.3 0.9 0.3 1.9c0 4.4-6.7 10.4-10 12.8z"/></g></svg>${nbLikes}</button>`;
    }
    else {
        return `<button id="like${postKey}" class="like liked" onclick="like('${postKey}')"><svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>coeur (1)-svg</title><style>.s2 { fill: #f91880 } </style><g id="Layer 1"><path id="Layer" class="s2" d="m17.5 0.9q-0.8 0-1.7 0.3-0.8 0.2-1.5 0.6-0.7 0.5-1.3 1.1-0.6 0.6-1 1.3-0.4-0.7-1-1.3-0.6-0.6-1.3-1.1-0.7-0.4-1.5-0.6-0.9-0.3-1.7-0.3-1.3 0.1-2.6 0.6-1.2 0.6-2.1 1.6-0.9 1-1.4 2.3-0.4 1.2-0.4 2.6c0 6.7 11 14.6 11.4 14.9l0.6 0.4 0.6-0.4c0.4-0.3 11.4-8.2 11.4-14.9q0-1.4-0.4-2.6-0.5-1.3-1.4-2.3-0.9-1-2.1-1.6-1.3-0.5-2.6-0.6z"/></g></svg>${nbLikes}</button>`
    }
}

const like = async (postKey) => {
    let idUserPost = postKey.slice(0, 28);

    const likerId = firebase.auth().currentUser.uid;

    const ref = firebase.database().ref(`users/${likerId}`);

    const ref2 = firebase.database().ref(`postsLikes/${postKey}/likes`);

    const snapshot = await firebase.database().ref(`users/${idUserPost}/posts/${postKey}`).once("value");

    let data = snapshot.val();

    const btn = document.getElementById(`like${postKey}`);

    const snapshot2 = await firebase.database().ref(`users/${likerId}`).once("value");

    let liked = snapshot2.val().liked || "";

    if (document.getElementById(`like${postKey}`).classList.contains("liked")) {

        liked = liked.split(',').filter(item => item !== postKey).join(',');

        ref.update({ liked: liked });

        const transac = await firebase.database().ref(`postsLikes/${postKey}`).once("value");

        let transacData = transac.val();

        let nbLikes = transacData.likes;
        nbLikes = Math.max(transacData.likes - 1, 0);

        firebase.database().ref(`postsLikes/${postKey}`).update({ likes: nbLikes });

        btn.classList.remove("liked");
        btn.classList.add("anim");
        setTimeout(() => {
            btn.classList.remove("anim");
        }, 300);
        btn.innerHTML = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>coeur-svg</title><style>.s1 { fill: #cacaca } </style><g id="_01_align_center"><path id="Layer" class="s1" d="m17.5 0.9q-0.8 0-1.7 0.3-0.8 0.2-1.5 0.6-0.7 0.5-1.3 1.1-0.6 0.6-1 1.3-0.4-0.7-1-1.3-0.6-0.6-1.3-1.1-0.7-0.4-1.5-0.6-0.9-0.3-1.7-0.3-1.3 0.1-2.6 0.6-1.2 0.6-2.1 1.6-0.9 1-1.4 2.3-0.4 1.2-0.4 2.6c0 6.7 11 14.6 11.4 14.9l0.6 0.4 0.6-0.4c0.4-0.3 11.4-8.2 11.4-14.9q0-1.4-0.4-2.6-0.5-1.3-1.4-2.3-0.9-1-2.1-1.6-1.3-0.5-2.6-0.6zm-5.5 19.9c-3.3-2.4-10-8.4-10-12.8q0-1 0.3-1.9 0.3-0.9 0.9-1.6 0.6-0.7 1.5-1.1 0.9-0.4 1.8-0.5 0.9 0.1 1.8 0.5 0.9 0.4 1.5 1.1 0.6 0.7 0.9 1.6 0.3 0.9 0.3 1.9h2q0-1 0.3-1.9 0.3-0.9 0.9-1.6 0.6-0.7 1.5-1.1 0.9-0.4 1.8-0.5 0.9 0.1 1.8 0.5 0.9 0.4 1.5 1.1 0.6 0.7 0.9 1.6 0.3 0.9 0.3 1.9c0 4.4-6.7 10.4-10 12.8z"/></g></svg>${nbLikes}`;
    }
    else {

        if (liked !== "") {
            liked += ",";
        }

        liked += postKey;

        ref.update({ liked: liked });

        const transac = await firebase.database().ref(`postsLikes/${postKey}`).once("value");

        let transacData = transac.val();

        let nbLikes;

        try {
            nbLikes = transacData.likes;
            nbLikes = transacData.likes + 1;
        } catch (error) {
            nbLikes = 1;
        }

        firebase.database().ref(`postsLikes/${postKey}`).update({ likes: nbLikes });

        btn.classList.add("liked");
        btn.classList.add("anim");
        setTimeout(() => {
            btn.classList.remove("anim");
        }, 300);
        btn.innerHTML = `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>coeur (1)-svg</title><style>.s2 { fill: #f91880 } </style><g id="Layer 1"><path id="Layer" class="s2" d="m17.5 0.9q-0.8 0-1.7 0.3-0.8 0.2-1.5 0.6-0.7 0.5-1.3 1.1-0.6 0.6-1 1.3-0.4-0.7-1-1.3-0.6-0.6-1.3-1.1-0.7-0.4-1.5-0.6-0.9-0.3-1.7-0.3-1.3 0.1-2.6 0.6-1.2 0.6-2.1 1.6-0.9 1-1.4 2.3-0.4 1.2-0.4 2.6c0 6.7 11 14.6 11.4 14.9l0.6 0.4 0.6-0.4c0.4-0.3 11.4-8.2 11.4-14.9q0-1.4-0.4-2.6-0.5-1.3-1.4-2.3-0.9-1-2.1-1.6-1.3-0.5-2.6-0.6z"/></g></svg>${nbLikes}`;
    }

}

const deleteModal = (postId) => {
    document.querySelector(`.modal#${postId}`).style.display = "block";
}

const deletePost = (postId) => {

    const ref = firebase.database().ref("users/" + userId + "/posts/" + postId);
    const ref2 = firebase.database().ref("users/" + userId + '/nbPosts');
    const ref3 = firebase.database().ref("users/" + userId + '/plats');
    const storageRef = firebase.storage().ref().child("users/" + userId + "/posts/" + postId);

    ref.once('value')
        .then((snapshot) => {
            let data = snapshot.val();

            if (data.photo == 1) {
                ref.remove()
                    .then(() => {
                        storageRef.delete()
                            .then(async () => {
                                ref2.transaction((val) => {
                                    return Math.max(val - 1, 0);
                                })

                                const snap = await ref3.once("value");

                                let dataPlats = snap.val();

                                let platASuppr = dataPlats.split(',');

                                let index = platASuppr.indexOf(data.plat);

                                if (index !== -1) {
                                    platASuppr.splice(index, 1);
                                }

                                platASuppr = platASuppr.join(",");

                                console.log(platASuppr);

                                ref3.set(platASuppr);

                                let restauDiv = document.createElement("div");

                                restauDiv.innerHTML = data.restaurant;

                                let restau = restauDiv.firstChild.textContent || restauDiv.firstChild.innerText;

                                const ref4 = firebase.database().ref("users/" + userId + '/restoNote/' + data.plat + "/" + restau);

                                ref4.remove();

                                window.location.href = 'profil.html?userId=' + userId;
                            })
                    })
                    .catch((error) => {
                        console.error("Erreur lors de la suppression de l'élément :", error);
                    });
            }

            else {
                ref.remove()
                    .then(async () => {
                        ref2.transaction((val) => {
                            return Math.max(val - 1, 0);
                        })

                        const snap = await ref3.once("value");

                        let dataPlats = snap.val();

                        let platASuppr = dataPlats.split(',');

                        let index = platASuppr.indexOf(data.plat);

                        if (index !== -1) {
                            platASuppr.splice(index, 1);
                        }

                        platASuppr = platASuppr.join(",");

                        console.log(platASuppr);

                        ref3.set(platASuppr);

                        let restauDiv = document.createElement("div");

                        restauDiv.innerHTML = data.restaurant;

                        let restau = restauDiv.firstChild.textContent || restauDiv.firstChild.innerText;

                        const ref4 = firebase.database().ref("users/" + userId + '/restoNote/' + data.plat + "/" + restau);

                        ref4.remove();

                        window.location.href = 'profil.html?userId=' + userId;
                    })
                    .catch((error) => {
                        console.error("Erreur lors de la suppression de l'élément :", error);
                    });
            }
        })
};

const follow = async () => {
    const id = userId;
    const followerId = firebase.auth().currentUser.uid;

    const usersRef = firebase.database().ref(`users/${followerId}`);

    const usersRef2 = firebase.database().ref(`users/${id}`);

    const ref2 = firebase.database().ref("users/" + id + '/nbFollowers');

    const ref3 = firebase.database().ref("users/" + followerId + '/nbFollowed');

    const snapshot = await usersRef.once("value");
    const snapshot2 = await usersRef2.once("value");

    let currentFollowed = snapshot.val().followed || ""; // Assurez-vous d'avoir une chaîne vide si la valeur est null
    let currentFollowers = snapshot2.val().followers || "";

    // Si l'élément a déjà la classe 'followed', cela signifie que l'utilisateur veut arrêter de suivre
    if (document.getElementById("btnFollow").classList.contains("followed")) {
        // Retirez l'ID de la liste
        currentFollowed = currentFollowed.split(',').filter(item => item !== id).join(',');
        currentFollowers = currentFollowers.split(',').filter(item => item !== followerId).join(',');

        usersRef.update({ followed: currentFollowed });

        usersRef2.update({ followers: currentFollowers });

        ref2.transaction((val) => {
            return Math.max(val - 1, 0);
        })

        ref3.transaction((val) => {
            return Math.max(val - 1, 0); // Décrémentez d'au plus 1, mais ne descendez jamais en dessous de zéro
        });

        document.getElementById("btnFollow").classList.remove("followed");
        document.getElementById("btnFollow").innerText = "Suivre";
    }

    else {
        if (currentFollowed !== "") {
            currentFollowed += ",";
        }

        currentFollowed += id;

        if (currentFollowers !== "") {
            currentFollowers += ",";
        }

        currentFollowers += followerId;

        const nbFollowed = snapshot.val().nbFollowed + 1;
        const nbFollowers = snapshot2.val().nbFollowers + 1;

        await usersRef.update({ nbFollowed: nbFollowed });
        await usersRef2.update({ nbFollowers: nbFollowers });

        usersRef.update({ followed: currentFollowed });
        usersRef2.update({ followers: currentFollowers });

        document.getElementById("btnFollow").classList.add("followed");
        document.getElementById("btnFollow").innerText = "Suivi(e)";
        return;
    }
}

const follow2 = async (id) => {
    const followerId = firebase.auth().currentUser.uid;

    const usersRef = firebase.database().ref(`users/${followerId}`);

    const usersRef2 = firebase.database().ref(`users/${id}`);

    const ref2 = firebase.database().ref("users/" + id + '/nbFollowers');

    const ref3 = firebase.database().ref("users/" + followerId + '/nbFollowed');

    const snapshot = await usersRef.once("value");
    const snapshot2 = await usersRef2.once("value");

    let currentFollowed = snapshot.val().followed || ""; // Assurez-vous d'avoir une chaîne vide si la valeur est null
    let currentFollowers = snapshot2.val().followers || "";

    // Si l'élément a déjà la classe 'followed', cela signifie que l'utilisateur veut arrêter de suivre
    if (document.getElementById(id).classList.contains("followed")) {
        // Retirez l'ID de la liste
        currentFollowed = currentFollowed.split(',').filter(item => item !== id).join(',');
        currentFollowers = currentFollowers.split(',').filter(item => item !== followerId).join(',');

        usersRef.update({ followed: currentFollowed });

        usersRef2.update({ followers: currentFollowers });

        ref2.transaction((val) => {
            return Math.max(val - 1, 0);
        })

        ref3.transaction((val) => {
            return Math.max(val - 1, 0); // Décrémentez d'au plus 1, mais ne descendez jamais en dessous de zéro
        });

        document.getElementById(id).classList.remove("followed");
        document.getElementById(id).innerText = "Suivre";
    }

    else {
        if (currentFollowed !== "") {
            currentFollowed += ",";
        }

        currentFollowed += id;

        if (currentFollowers !== "") {
            currentFollowers += ",";
        }

        currentFollowers += followerId;

        const nbFollowed = snapshot.val().nbFollowed + 1;
        const nbFollowers = snapshot2.val().nbFollowers + 1;

        await usersRef.update({ nbFollowed: nbFollowed });
        await usersRef2.update({ nbFollowers: nbFollowers });

        usersRef.update({ followed: currentFollowed });
        usersRef2.update({ followers: currentFollowers });

        document.getElementById(id).classList.add("followed");
        document.getElementById(id).innerText = "Suivi(e)";
        return;
    }
}

const hide = (id) => {
    document.getElementById(id).classList.remove("displayList");
}

const getDefaultImg = async () => {
    return new Promise((resolve, reject) => {
        let storageRef = firebase.storage().ref();
        let imageRef = storageRef.child(`defaultpp.svg`);

        imageRef.getDownloadURL()
            .then((url) => {
                resolve(url);
            })
            .catch((error) => {
                reject(error);
            });
    })
}

document.addEventListener('DOMContentLoaded', async () => {
    const editNom = document.getElementById('editNom');
    const editDescr = document.getElementById('editDescr');
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
        window.location.href = './index.html';
    });

    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const getPlatsData = async () => {
        return new Promise(async (resolve, reject) => {
            const ref = firebase.database().ref(`users/${userId}/plats`);
            ref.once("value", (snap) => {
                const plats = snap.val();

                if (plats) {
                    resolve(plats.split(","));
                }
                else {
                    resolve(null);
                }
            });
        });
    }

    let resultsContainer = document.querySelectorAll(".modal");

    document.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        const buttons = document.querySelectorAll(".deleteModal");

        modals.forEach((modal) => {
            if (!modal.contains(event.target) && !isButtonClicked(buttons, event.target)) {
                modal.style.display = 'none';
            }
        });
    });

    function isButtonClicked(buttons, target) {
        for (const button of buttons) {
            if (button.contains(target)) {
                return true;
            }
        }
        return false;
    }

    const getStats = async () => {
        const postsData = await getPlatsData();
        const ref = firebase.database().ref(`users/${userId}/nbPosts`);
        const snap = await ref.once('value');
        const nbPosts = snap.val();
        const container = document.getElementById('statsContainer');

        if (!postsData) {
            container.parentElement.style.display = "none";
            return;
        }

        let platCounts = {};
        for (let i = 0; i < postsData.length; i++) {
            const platType = postsData[i];

            if (platType !== "") {
                // Retirer la sous-chaîne "[object Object]" de la chaîne
                const cleanedPlatType = platType.replace("[object Object]", "");

                platCounts[cleanedPlatType] = (platCounts[cleanedPlatType] || 0) + 1;
            }
        }

        for (let i = 0; i < Object.keys(platCounts).length; i++) {
            // Préparez les données pour Chart.js
            const labels = Object.keys(platCounts)[i];
            const data = Object.values(platCounts)[i];
            const color = getRandomColor();

            if (i > 1) {
                // Récupérer la taille actuelle du conteneur en pixels
                const tailleConteneurEnPixels = getComputedStyle(container).width;

                // Convertir la taille du conteneur de pixels à vw
                const tailleConteneurEnVW = parseFloat(tailleConteneurEnPixels) / window.innerWidth * 100;

                // Ajouter 35vw à la taille actuelle
                const nouvelleTailleEnVW = tailleConteneurEnVW + 40;

                // Appliquer la nouvelle taille au conteneur
                container.style.width = nouvelleTailleEnVW + "vw";
            }

            // Création des balises
            const platCanvas = document.createElement("div");
            platCanvas.classList.add('graphecontainer');
            platCanvas.innerHTML = `
                <canvas id="platChart${i}"></canvas>
                <div class="canvasTxt">${data}<div>${labels}</div></div>
            `;

            container.appendChild(platCanvas)

            // Configurez le graphique avec Chart.js
            const ctx = document.getElementById(`platChart${i}`).getContext('2d');
            const platChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: [labels, "Total"],
                    datasets: [
                        {
                            label: `Nombre de posts`,
                            data: [data, nbPosts - data],
                            backgroundColor: [color, 'rgb(255, 255, 255)'],
                            borderWidth: 0,
                        }
                    ]
                },
                options: {
                    animation: {
                        duration: 0
                    },
                    events: [],
                    plugins: {
                        legend: {
                            display: false, // Masquer la légende
                        },
                    }
                }
            });
        }
    }

    const trierParNoteDecroissante = (data, plat) => {
        var restaurants = Object.keys(data[plat]);
        restaurants.sort((a, b) => {
            return data[plat][b].note - data[plat][a].note;
        });

        // Utiliser map pour transformer l'objet trié en tableau
        var platTrié = restaurants.map((restaurant) => {
            return { [restaurant]: data[plat][restaurant] };
        });

        return platTrié;
    }

    const getTop = async () => {
        const ref = firebase.database().ref(`users/${userId}/restoNote`);

        const snapshot = await ref.once("value");

        const data = snapshot.val();

        const container = document.getElementById("topContainer");

        if (!data) {
            container.parentElement.style.display = "none";
        }
        else {
            Object.keys(data).forEach(key => {
                const notesTab = trierParNoteDecroissante(data, key);
                const container2 = document.createElement("div");
                container2.classList.add('topPlat')
    
                const titrePlat = document.createElement("h4");
                titrePlat.innerText = key;
                container2.appendChild(titrePlat);
                let compteur = 1;
                notesTab.forEach(el => {
    
                    for (const resto in el) {
                        if (compteur < 11) {
                            if (Object.hasOwnProperty.call(el, resto)) {
                                const element = el[resto];
                                const topPlat = document.createElement("div");
                                topPlat.classList.add("topRestau");
    
                                topPlat.innerHTML = ` 
                                <span>${compteur}. </span>${element.lien}
                                <span class='note'> : ${element.note} <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 617" width="15" height="15"><title>stars-svg</title><style>.s0 { fill: #0099ff; transform: translateY(10%) } </style><g id="Layer"><path id="Layer" fill-rule="evenodd" class="s0" d="m318.6 7.3c-8.8 3.1-12.1 6.7-19.7 21-3.9 7.2-22.1 43.3-40.7 80.3-36.1 72.1-37.3 74.2-46.8 78.6-3.5 1.7-23.2 4.7-93.9 14.8-84.7 12.1-89.8 12.9-95.7 15.7-10.7 5.3-16.8 16.3-15.6 28.6 1 11 0.6 10.6 59 66.3 83.7 79.9 79.9 75.9 82.1 86.4 0.9 4.3-0.6 13.9-14.3 92.2-11.7 67-15.2 88.6-14.8 92.9 0.8 9.9 6.9 18.6 16.2 23.1 4.8 2.4 6.7 2.8 13.9 2.8h8.4l78.9-40.8c43.4-22.4 80.9-41.5 83.5-42.4 2.4-0.9 7-1.7 9.9-1.7 2.9 0 7.5 0.8 9.9 1.7 2.6 0.9 40.1 20 83.5 42.4l78.9 40.8h8.4c7.2 0 9.1-0.4 13.9-2.8 9.3-4.5 15.4-13.2 16.2-23.1 0.4-4.3-3.1-25.9-14.8-92.9-13.7-78.3-15.2-87.9-14.3-92.2 2.2-10.5-1.6-6.5 82.1-86.4 58.4-55.7 58-55.3 59-66.3 1.2-12.3-4.9-23.3-15.6-28.6-5.9-2.8-11-3.6-95.7-15.7-70.7-10.1-90.4-13.1-93.9-14.8-9.5-4.4-10.3-5.7-52.8-90.3-42.5-84.6-42.4-84.5-51.9-88.7-6.4-2.8-16.8-3.3-23.3-0.9z"/></g></svg></span>
                                `;
                                container2.appendChild(topPlat);
                            }
                            compteur++;
                        }
                    }
    
                });
                // Récupérer la taille actuelle du conteneur en pixels
                const tailleConteneurEnPixels = getComputedStyle(container).width;
    
                // Convertir la taille du conteneur de pixels à vw
                const tailleConteneurEnVW = parseFloat(tailleConteneurEnPixels) / window.innerWidth * 100;
    
                // Ajouter 35vw à la taille actuelle
                const nouvelleTailleEnVW = tailleConteneurEnVW + 80;
    
                // Appliquer la nouvelle taille au conteneur
                container.style.width = nouvelleTailleEnVW + "vw";
    
                container.appendChild(container2);
            });
        }
    }

    getStats();
    getTop();

    const compteurFollowers = document.getElementById("follow");
    const compteurFollowed = document.getElementById("suivi");
    const followerList = document.getElementById("followerList");
    const followedList = document.getElementById("followedList");

    compteurFollowers.addEventListener("click", async () => {
        followerList.classList.add("displayList");

        followerList.classList.add("displayList");

        const container = document.querySelector("#followerList ul");
        container.innerHTML = "";

        const ref = firebase.database().ref(`users/${userId}`);

        const snapshot = await ref.once("value");

        let data = snapshot.val();
        let followers = data.followers;

        if (typeof followers === 'string') {
            followers = followers.split(',');
        } else {
            followers = [];
        }

        const currentSnapshot = await firebase.database().ref(`users/${firebase.auth().currentUser.uid}`).once("value");

        let currentData = currentSnapshot.val();

        let followed = currentData.followed;

        if (typeof followed === 'string') {
            followed = followed.split(',');
        } else {
            followed = [];
        }

        followers.forEach(async el => {
            const listFollowers = document.createElement("li");

            const snapshot2 = await firebase.database().ref(`users/${el}`).once("value");

            let data2 = snapshot2.val();

            if (data2.defaultpp == 1 && followed.includes(el) && firebase.auth().currentUser.uid !== el) {
                listFollowers.innerHTML = `
                <a href='./profil.html?userId=${el}'><img src="${await getDefaultImg()}"></a>
                <a href='./profil.html?userId=${el}'>${data2.name}</a>
                <button id="${el}" class='followed' onclick="follow2('${el}')">Suivi(e)</button>
              `;
            }
            else if (data2.defaultpp == 0 && followed.includes(el) && firebase.auth().currentUser.uid !== el) {
                listFollowers.innerHTML = `
                <a href='./profil.html?userId=${el}'><img src="${await getImgPP(el)}"></a>
                <a href='./profil.html?userId=${el}'>${data2.name}</a>
                <button id="${el}" class='followed' onclick="follow2('${el}')">Suivi(e)</button>
              `;
            }
            else if (!followed.includes(el) && data2.defaultpp == 0 && firebase.auth().currentUser.uid !== el) {
                listFollowers.innerHTML = `
                <a href='./profil.html?userId=${el}'><img src="${await getImgPP(el)}"></a>
                <a href='./profil.html?userId=${el}'>${data2.name}</a>
                <button id="${el}" onclick="follow2('${el}')">Suivre</button>
              `;
            }
            else if (!followed.includes(el) && data2.defaultpp == 1 && firebase.auth().currentUser.uid !== el) {
                listFollowers.innerHTML = `
                <a href='./profil.html?userId=${el}'><img src="${await getDefaultImg()}"></a>
                <a href='./profil.html?userId=${el}'>${data2.name}</a>
                <button id="${el}" onclick="follow2('${el}')">Suivre</button>
              `;
            }
            else if (data2.defaultpp == 1 && firebase.auth().currentUser.uid == el) {
                listFollowers.innerHTML = `
                <a href='./profil.html?userId=${el}'><img src="${await getDefaultImg()}"></a>
                <a href='./profil.html?userId=${el}'>${data2.name}</a>
              `;
            }
            else if (data2.defaultpp == 0 && firebase.auth().currentUser.uid == el) {
                listFollowers.innerHTML = `
                <a href='./profil.html?userId=${el}'><img src="${await getImgPP(el)}"></a>
                <a href='./profil.html?userId=${el}'>${data2.name}</a>
              `;
            }

            container.appendChild(listFollowers);
        });
    });

    compteurFollowed.addEventListener("click", async () => {
        followedList.classList.add("displayList");

        const container = document.querySelector("#followedList ul");
        container.innerHTML = "";

        const ref = firebase.database().ref(`users/${userId}`);

        const snapshot = await ref.once("value");

        let data = snapshot.val();
        let followed = data.followed;

        if (typeof followed === 'string') {
            followed = followed.split(',');
        } else {
            followed = [];
        }

        followed.forEach(async el => {
            const listFollowers = document.createElement("li");

            const snapshot2 = await firebase.database().ref(`users/${el}`).once("value");

            let data2 = snapshot2.val();

            if (data2.defaultpp == 1) {
                listFollowers.innerHTML = `
                <a href='./profil.html?userId=${el}'><img src="${await getDefaultImg()}"></a>
                <a href='./profil.html?userId=${el}'>${data2.name}</a>
                <button id="${el}" class='followed' onclick="follow2('${el}')">Suivi(e)</button>
              `;
            }
            else {
                listFollowers.innerHTML = `
                <a href='./profil.html?userId=${el}'><img src="${await getImgPP(el)}"></a>
                <a href='./profil.html?userId=${el}'>${data2.name}</a>
                <button id="${el}" class='followed' onclick="follow2('${el}')">Suivi(e)</button>
              `;
            }

            container.appendChild(listFollowers);
        });
    });
})