window.addEventListener('load', async ()=>{
    const imgList = document.getElementById('img-list');

    const baseUrl = window.location.origin;

    const response = await fetch(baseUrl + '/api');
    const images = await response.json();

    const HTMLContent = images.reduce((total, image) => {
        const date = new Date(image.date).toLocaleString();
        const li = `
            <li>
                <div class="info">
                    <p class="date">Date: ${date}</p>
                    <p class="img-name">Name: ${image.name}</p>
                </div>
                <div class="img-container">
                    <img src="${image.url}" alt="${image.name}"/>
                </div>
            </li>
        `;
        return total + li;
    }, '');

    imgList.innerHTML = HTMLContent;
});