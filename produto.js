
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

async function loadProduct() {
    const response = await fetch("produtos.json");
    const products = await response.json();

    const product = products.find(item => String(item.id) === productId);
    const details = document.getElementById("productDetails");
    const related = document.getElementById("relatedProducts");

    if (!product) {
        details.innerHTML = "<h2>Produto não encontrado</h2>";
        return;
    }

    details.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}">
        </div>

        <div class="product-info">
            <span class="product-category">${product.category}</span>
            <h1>${product.name}</h1>

            <div class="product-prices">
                ${product.oldPrice ? `<span class="old-price">${product.oldPrice}</span>` : ""}
                <span class="current-price">${product.price || "Consultar oferta"}</span>
            </div>

            <a class="buy-button" href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer">
                Ver oferta no Mercado Livre
            </a>
        </div>
    `;

    const relatedProducts = products
        .filter(item => String(item.id) !== productId)
        .slice(0, 4);

    related.innerHTML = relatedProducts.map(item => `
        <a href="produto.html?id=${item.id}" class="product-card">
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <span>${item.price || "Consultar oferta"}</span>
        </a>
    `).join("");
}

loadProduct();
