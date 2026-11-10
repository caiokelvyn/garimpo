
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

        filterProducts();

    } catch (error) {
        productsGrid.innerHTML = "<p>Não foi possível carregar os produtos. Verifique o arquivo produtos.json.</p>";
    }
}

function renderProducts(items) {
    productsGrid.innerHTML = "";

    if (items.length === 0) {
        noResults.hidden = false;
        return;
    }

    noResults.hidden = true;

    items.forEach((product) => {
        const card = document.createElement("article");
        card.className = "product-card";

        const link = document.createElement("a");
        link.className = "product-details-link";
        link.href = `produto.html?id=${encodeURIComponent(product.id)}`;
        link.setAttribute("aria-label", `Ver detalhes de ${product.name}`);

        const imageContainer = document.createElement("div");
        imageContainer.className = "product-image";

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

        const price = document.createElement("p");
        price.className = "product-price";
        price.textContent = product.price || "Consultar oferta";

        const button = document.createElement("span");
        button.className = "product-button";
        button.textContent = "Ver produto";

        info.append(category, name, description, price, button);
        link.append(imageContainer, info);
        card.appendChild(link);

        productsGrid.appendChild(card);
    });
}

function filterProducts() {
    const term = normalizeText(searchInput.value);

    const filteredProducts = products.filter((product) => {
        const productCategory = normalizeText(product.category);

        const matchesCategory = !selectedCategory ||
            productCategory === normalizeText(selectedCategory);

        const matchesSearch = !term ||
            normalizeText(product.name).includes(term) ||
            productCategory.includes(term) ||
            normalizeText(product.description).includes(term);

        return matchesCategory && matchesSearch;
    });

    renderProducts(filteredProducts);
}

function selectCategory(category) {
    selectedCategory = category;
    searchInput.value = "";

    filterProducts();

    document.getElementById("produtos").scrollIntoView({
        behavior: "smooth"
    });
}

function showAllCategories() {
    selectedCategory = "";
    searchInput.value = "";

    filterProducts();

    document.getElementById("categorias").scrollIntoView({
        behavior: "smooth"
    });
}

searchButton.addEventListener("click", () => {
    selectedCategory = "";
    filterProducts();
});

searchInput.addEventListener("input", () => {
    selectedCategory = "";
    filterProducts();
});

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        selectedCategory = "";
        filterProducts();
    }
});

document.querySelectorAll(".category-card").forEach((category) => {
    category.addEventListener("click", (event) => {
        event.preventDefault();

        selectCategory(category.dataset.category);
    });
});

document.querySelectorAll(".navbar a").forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();

        const categoryName = link.dataset.category;

        if (!categoryName) {
            showAllCategories();
            return;
        }

        selectCategory(categoryName);
    });
});

loadProducts();
