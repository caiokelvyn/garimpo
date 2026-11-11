
const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const noResults = document.getElementById("noResults");

let products = [];
let selectedCategory = "";

function normalizeText(text) {
    return String(text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function parsePrice(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    if (!value) return 0;

    let normalized = String(value).replace(/[^\d.,]/g, "");

    if (normalized.includes(",")) {
        normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else if ((normalized.match(/\./g) || []).length > 1) {
        normalized = normalized.replace(/\./g, "");
    }

    const price = Number(normalized);
    return Number.isFinite(price) ? price : 0;
}

function getDiscount(oldPrice, currentPrice) {
    const oldValue = parsePrice(oldPrice);
    const currentValue = parsePrice(currentPrice);

    if (!oldValue || !currentValue || oldValue <= currentValue) return 0;

    return Math.round((1 - currentValue / oldValue) * 100);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

async function loadProducts() {
    try {
        const response = await fetch("produtos.json");

        if (!response.ok) {
            throw new Error("Não foi possível carregar os produtos.");
        }

        products = await response.json();

        if (!Array.isArray(products)) {
            throw new Error("O catálogo de produtos é inválido.");
        }

        renderCategoryFilters();
        filterProducts();

    } catch (error) {
        productsGrid.innerHTML = "<p>Não foi possível carregar os produtos. Verifique o arquivo produtos.json.</p>";
        document.getElementById("productCount").textContent = "";
    }
}

function renderCategoryFilters() {
    const container = document.getElementById("categoryFilters");

    const categories = [...new Set(
        products.map(product => product.category).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "pt-BR"));

    container.innerHTML = `
        <label class="filter-option">
            <input type="radio" name="categoryFilter" value="" checked>
            Todas as categorias
        </label>
        ${categories.map(category => `
            <label class="filter-option">
                <input type="radio" name="categoryFilter" value="${escapeHTML(category)}">
                ${escapeHTML(category)}
            </label>
        `).join("")}
    `;

    container.querySelectorAll("input").forEach(input => {
        input.addEventListener("change", () => {
            selectedCategory = input.value;
            filterProducts();
        });
    });
}

function renderProducts(items) {
    productsGrid.innerHTML = "";

    noResults.hidden = items.length > 0;

    document.getElementById("productCount").textContent =
        `${items.length} produto(s) encontrado(s)`;

    if (items.length === 0) return;

    items.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        const link = document.createElement("a");
        link.className = "product-details-link";
        link.href = `produto.html?id=${encodeURIComponent(product.id)}`;
        link.setAttribute("aria-label", `Ver detalhes de ${product.name || "produto"}`);

        const imageContainer = document.createElement("div");
        imageContainer.className = "product-image";

        const discount = getDiscount(product.oldPrice, product.price);

        if (discount > 0) {
            const badge = document.createElement("span");
            badge.className = "discount-badge";
            badge.textContent = `-${discount}%`;
            imageContainer.appendChild(badge);
        }

        if (product.bestSeller) {
            const sellerBadge = document.createElement("span");
            sellerBadge.className = "best-seller-badge";
            sellerBadge.textContent = "Mais vendido";
            imageContainer.appendChild(sellerBadge);
        } else if (product.featured) {
            const featuredBadge = document.createElement("span");
            featuredBadge.className = "featured-badge";
            featuredBadge.textContent = "Destaque";
            imageContainer.appendChild(featuredBadge);
        }

        const image = document.createElement("img");
        image.src = product.image || "";
        image.alt = product.name || "";
        image.loading = "lazy";

        imageContainer.appendChild(image);

        const info = document.createElement("div");
        info.className = "product-info";

        const category = document.createElement("span");
        category.className = "product-category";
        category.textContent = product.category || "";

        const name = document.createElement("h3");
        name.textContent = product.name || "";

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = product.description || "";

        const prices = document.createElement("div");
        prices.className = "product-card-prices";

        if (discount > 0) {
            const oldPrice = document.createElement("span");
            oldPrice.className = "product-old-price";
            oldPrice.textContent = product.oldPrice;
            prices.appendChild(oldPrice);
        }

        const price = document.createElement("p");
        price.className = "product-price";
        price.textContent = product.price || "Consultar oferta";

        prices.appendChild(price);

        const button = document.createElement("span");
        button.className = "product-button";
        button.textContent = "Ver produto";

        info.append(category, name);

        if (product.description) {
            info.appendChild(description);
        }

        info.append(prices, button);
        link.append(imageContainer, info);
        card.appendChild(link);
        productsGrid.appendChild(card);
    });
}

function filterProducts() {
    const term = normalizeText(searchInput.value);
    const minPrice = parsePrice(document.getElementById("minPrice").value);
    const maxInput = document.getElementById("maxPrice").value;
    const maxPrice = maxInput === "" ? Infinity : parsePrice(maxInput);

    const discountOnly = document.getElementById("discountOnly").checked;
    const featuredOnly = document.getElementById("featuredOnly").checked;
    const bestSellerOnly = document.getElementById("bestSellerOnly").checked;

    let filteredProducts = products.filter(product => {
        const productCategory = normalizeText(product.category);
        const currentPrice = parsePrice(product.price);
        const discount = getDiscount(product.oldPrice, product.price);

        const matchesCategory = !selectedCategory ||
            productCategory === normalizeText(selectedCategory);

        const matchesSearch = !term ||
            normalizeText(product.name).includes(term) ||
            productCategory.includes(term) ||
            normalizeText(product.description).includes(term);

        const matchesMin = !minPrice || currentPrice >= minPrice;
        const matchesMax = currentPrice <= maxPrice;
        const matchesDiscount = !discountOnly || discount > 0;
        const matchesFeatured = !featuredOnly || product.featured;
        const matchesBestSeller = !bestSellerOnly || product.bestSeller;

        return matchesCategory &&
            matchesSearch &&
            matchesMin &&
            matchesMax &&
            matchesDiscount &&
            matchesFeatured &&
            matchesBestSeller;
    });

    const sort = document.getElementById("sortProducts").value;

    if (sort === "price-asc") {
        filteredProducts.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sort === "price-desc") {
        filteredProducts.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    } else if (sort === "discount") {
        filteredProducts.sort((a, b) =>
            getDiscount(b.oldPrice, b.price) - getDiscount(a.oldPrice, a.price)
        );
    } else if (sort === "name") {
        filteredProducts.sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || ""), "pt-BR")
        );
    } else {
        filteredProducts.sort((a, b) =>
            Number(Boolean(b.bestSeller)) - Number(Boolean(a.bestSeller)) ||
            Number(Boolean(b.featured)) - Number(Boolean(a.featured))
        );
    }

    const title = document.getElementById("catalogTitle");
    title.textContent = selectedCategory || "Todos os produtos";

    renderProducts(filteredProducts);
}

function selectCategory(category) {
    selectedCategory = category;

    document.querySelectorAll('input[name="categoryFilter"]').forEach(input => {
        input.checked = input.value === category;
    });

    filterProducts();

    document.getElementById("produtos").scrollIntoView({
        behavior: "smooth"
    });
}

function clearFilters() {
    selectedCategory = "";
    searchInput.value = "";
    document.getElementById("minPrice").value = "";
    document.getElementById("maxPrice").value = "";
    document.getElementById("discountOnly").checked = false;
    document.getElementById("featuredOnly").checked = false;
    document.getElementById("bestSellerOnly").checked = false;
    document.getElementById("sortProducts").value = "featured";

    document.querySelectorAll('input[name="categoryFilter"]').forEach(input => {
        input.checked = input.value === "";
    });

    filterProducts();
}

searchButton.addEventListener("click", () => {
    selectedCategory = "";
    filterProducts();
});

searchInput.addEventListener("input", () => {
    selectedCategory = "";
    filterProducts();
});

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        selectedCategory = "";
        filterProducts();
    }
});

document.querySelectorAll(".category-card, .navbar a").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        selectCategory(link.dataset.category || "");
    });
});

["minPrice", "maxPrice", "discountOnly", "featuredOnly", "bestSellerOnly"].forEach(id => {
    document.getElementById(id).addEventListener("input", filterProducts);
    document.getElementById(id).addEventListener("change", filterProducts);
});

document.getElementById("sortProducts").addEventListener("change", filterProducts);
document.getElementById("clearFilters").addEventListener("click", clearFilters);

document.getElementById("mobileFilterButton").addEventListener("click", () => {
    document.getElementById("filterSidebar").classList.toggle("filters-open");
});

loadProducts();
