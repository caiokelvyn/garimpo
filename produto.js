
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const whatsappGroupUrl = "https://chat.whatsapp.com/BY2RTReSVOZ0d8MsQjJU9M?s=cl&p=i&mlu=4&ilr=4&iam=2";

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function parsePrice(value) {
    if (typeof value === "number") return value;

    let price = String(value || "").replace(/[^\d.,]/g, "");

    if (price.includes(",")) {
        price = price.replace(/\./g, "").replace(",", ".");
    }

    const result = Number(price);
    return Number.isFinite(result) ? result : null;
}

function getDiscount(oldPrice, currentPrice) {
    const oldValue = parsePrice(oldPrice);
    const currentValue = parsePrice(currentPrice);

    if (!oldValue || !currentValue || oldValue <= currentValue) {
        return 0;
    }

    return Math.round((1 - currentValue / oldValue) * 100);
}

function renderProduct(product, products) {
    const details = document.getElementById("productDetails");
    const related = document.getElementById("relatedProducts");
    const breadcrumb = document.getElementById("breadcrumbCategory");

    const name = escapeHTML(product.name || "Produto");
    const category = escapeHTML(product.category || "");
    const image = escapeHTML(product.image || "");
    const price = escapeHTML(product.price || "Consultar oferta");
    const oldPrice = escapeHTML(product.oldPrice || "");
    const description = escapeHTML(product.description || "");

    const discount = getDiscount(product.oldPrice, product.price);

    const productUrl = new URL(
        `produto.html?id=${encodeURIComponent(product.id)}`,
        window.location.href
    ).href;

    const shareMessage = `Olha que oferta encontrei no Garimpo dos Bons!\n\n${product.name}\n${product.price || "Consulte a oferta"}\n\nConfira aqui: ${productUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

    const features = Array.isArray(product.features)
        ? product.features
        : typeof product.features === "string"
            ? product.features.split("\n").filter(item => item.trim())
            : [];

    const safeFeatures = features
        .map(item => `<li>${escapeHTML(item)}</li>`)
        .join("");

    const descriptionSection = description
        ? `
            <section class="detail-extra-section">
                <h2>Descrição do produto</h2>
                <p>${description}</p>
            </section>
        `
        : "";

    const featuresSection = safeFeatures
        ? `
            <section class="detail-extra-section">
                <h2>Características do produto</h2>
                <ul class="features-list">${safeFeatures}</ul>
            </section>
        `
        : "";

    const affiliateButton = product.affiliateUrl
        ? `
            <a class="buy-button" href="${escapeHTML(product.affiliateUrl)}" target="_blank" rel="noopener noreferrer">
                Ver oferta no Mercado Livre
            </a>
        `
        : `
            <p class="detail-unavailable">Link da oferta não cadastrado.</p>
        `;

    details.innerHTML = `
        <div class="detail-image">
            ${discount ? `<span class="detail-discount-badge">-${discount}% OFF</span>` : ""}
            <img src="${image}" alt="${name}">
        </div>

        <div class="detail-info">
            ${category ? `<span class="detail-category">${category}</span>` : ""}

            <h1>${name}</h1>

            <div class="detail-rating-note">
                Confira as informações e a disponibilidade no Mercado Livre.
            </div>

            <div class="detail-divider"></div>

            <div class="detail-price-area">
                ${oldPrice ? `<p class="detail-old-price">${oldPrice}</p>` : ""}
                <p class="detail-price">${price}</p>
                ${discount ? `<span class="detail-discount-text">${discount}% de desconto</span>` : ""}
            </div>

            ${affiliateButton}

            <div class="whatsapp-actions">
                <a class="whatsapp-share-button" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">
                    <span>↗</span>
                    Compartilhar
                </a>

                <a class="whatsapp-group-button" href="${whatsappGroupUrl}" target="_blank" rel="noopener noreferrer">
                    <span>●</span>
                    Entrar no grupo
                </a>
            </div>

            <div class="detail-delivery-note">
                <strong>Garimpo dos Bons</strong>
                <p>Encontre boas ofertas e aproveite as oportunidades.</p>
                <p>Preço e disponibilidade podem mudar no site da loja.</p>
            </div>

            ${descriptionSection}
            ${featuresSection}
        </div>
    `;

    if (breadcrumb) {
        breadcrumb.textContent = product.category || "Produto";
    }

    document.title = `${product.name || "Produto"} | Garimpo dos Bons`;

    const relatedProducts = products
        .filter(item =>
            String(item.id) !== productId &&
            item.category &&
            product.category &&
            item.category.toLowerCase() === product.category.toLowerCase()
        )
        .slice(0, 4);

    const productsToShow = relatedProducts.length
        ? relatedProducts
        : products.filter(item => String(item.id) !== productId).slice(0, 4);

    related.innerHTML = productsToShow.map(item => `
        <a href="produto.html?id=${encodeURIComponent(item.id)}" class="product-card related-product-card">
            <img src="${escapeHTML(item.image || "")}" alt="${escapeHTML(item.name || "")}">
            <div class="product-info">
                <h3>${escapeHTML(item.name || "")}</h3>
                <p class="product-price">${escapeHTML(item.price || "Consultar oferta")}</p>
            </div>
        </a>
    `).join("");

    if (!productsToShow.length) {
        related.innerHTML = "<p>Não há outros produtos disponíveis no momento.</p>";
    }
}

async function loadProduct() {
    const details = document.getElementById("productDetails");

    try {
        const response = await fetch("produtos.json");

        if (!response.ok) {
            throw new Error("Não foi possível carregar o catálogo.");
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
            throw new Error("Catálogo inválido.");
        }

        const product = products.find(item => String(item.id) === productId);

        if (!product) {
            details.innerHTML = `
                <div class="product-not-found">
                    <h2>Produto não encontrado</h2>
                    <p>Este produto pode ter sido removido do catálogo.</p>
                    <a href="index.html" class="buy-button">Voltar para a página inicial</a>
                </div>
            `;
            return;
        }

        renderProduct(product, products);

    } catch (error) {
        details.innerHTML = `
            <div class="product-not-found">
                <h2>Não foi possível carregar o produto</h2>
                <p>Verifique sua conexão e tente novamente.</p>
            </div>
        `;
    }
}

loadProduct();
