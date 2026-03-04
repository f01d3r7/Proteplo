(function () {
            const blocks = document.querySelectorAll(".filter--range");
            const filtersRoot = document.querySelector(".catalog__filters");
            const resetButton = document.querySelector(".catalog__filters-reset");
            if (!filtersRoot) return;
            const chipsRoot = document.querySelector(".catalog__chips");
            const chipGroupConstruct = chipsRoot ? chipsRoot.querySelector('[data-chip-group="construct"]') : null;
            const chipGroupDn = chipsRoot ? chipsRoot.querySelector('[data-chip-group="dn"]') : null;
            const chipGroupArea = chipsRoot ? chipsRoot.querySelector('[data-chip-group="area"]') : null;
            const chipGroupCountry = chipsRoot ? chipsRoot.querySelector('[data-chip-group="country"]') : null;

            const filterSections = Array.from(filtersRoot.querySelectorAll(".filter"));
            const constructSection = filterSections.find(function (section) {
                const title = section.querySelector(".filter__title");
                return title && title.textContent.trim() === "Конструктив";
            });
            const dnSection = filterSections.find(function (section) {
                const title = section.querySelector(".filter__title");
                return title && title.textContent.trim() === "DN - номинальный диаметр, мм";
            });
            const areaSection = filterSections.find(function (section) {
                const title = section.querySelector(".filter__title");
                return title && title.textContent.trim() === "Площадь теплообмена (max), м2";
            });
            const countrySection = filterSections.find(function (section) {
                const title = section.querySelector(".filter__title");
                return title && title.textContent.trim() === "Страна производителя";
            });

            function parseNumber(value) {
                const normalized = String(value).replace(",", ".").replace(/[^\d.]/g, "");
                const parsed = Number(normalized);
                return Number.isNaN(parsed) ? null : parsed;
            }

            function clamp(value, min, max) {
                return Math.min(max, Math.max(min, value));
            }

            function formatNumber(value) {
                const num = Number(value);
                if (!Number.isFinite(num)) return String(value);
                if (Math.abs(num - Math.round(num)) < 1e-9) return String(Math.round(num));
                return String(num);
            }

            function ensureInputId(input, prefix) {
                if (input.id) return input.id;
                const id = prefix + "-" + Math.random().toString(36).slice(2, 9);
                input.id = id;
                return id;
            }

            function getCheckboxText(input) {
                const label = input.closest("label");
                if (!label) return "";
                const clone = label.cloneNode(true);
                const inputClone = clone.querySelector("input");
                if (inputClone) inputClone.remove();
                clone.querySelectorAll("sup").forEach(function (sup) {
                    sup.remove();
                });
                return clone.textContent.replace(/\s+/g, " ").trim();
            }

            function clearGroupChips(group) {
                if (!group) return;
                group.querySelectorAll(".catalog-chip").forEach(function (chip) {
                    chip.remove();
                });
            }

            function addCheckboxChips(group, inputs, idPrefix) {
                if (!group || !inputs.length) return;
                clearGroupChips(group);
                let count = 0;

                inputs.forEach(function (input) {
                    if (!input.checked) return;
                    const inputId = ensureInputId(input, idPrefix);
                    const text = getCheckboxText(input);
                    if (!text) return;

                    const chip = document.createElement("span");
                    chip.className = "catalog-chip";
                    chip.dataset.targetInput = inputId;
                    chip.appendChild(document.createTextNode(text + " "));

                    const close = document.createElement("button");
                    close.className = "catalog-chip__close";
                    close.type = "button";
                    close.setAttribute("aria-label", "Убрать фильтр " + text);
                    close.textContent = "×";
                    chip.appendChild(close);

                    group.appendChild(chip);
                    count += 1;
                });

                group.hidden = count === 0;
            }

            function renderAreaChip() {
                if (!chipGroupArea || !areaSection) return;
                clearGroupChips(chipGroupArea);

                const minRange = areaSection.querySelector(".price-range__input--min");
                const maxRange = areaSection.querySelector(".price-range__input--max");
                if (!minRange || !maxRange) {
                    chipGroupArea.hidden = true;
                    return;
                }

                const minDefault = String(minRange.defaultValue);
                const maxDefault = String(maxRange.defaultValue);
                const minCurrent = String(minRange.value);
                const maxCurrent = String(maxRange.value);
                const isDefault = minDefault === minCurrent && maxDefault === maxCurrent;
                if (isDefault) {
                    chipGroupArea.hidden = true;
                    return;
                }

                const text = formatNumber(minCurrent) + " ... " + formatNumber(maxCurrent) + " м²";
                const chip = document.createElement("span");
                chip.className = "catalog-chip";
                chip.dataset.rangeGroup = "area";
                chip.appendChild(document.createTextNode(text + " "));

                const close = document.createElement("button");
                close.className = "catalog-chip__close";
                close.type = "button";
                close.setAttribute("aria-label", "Сбросить фильтр Площадь теплообмена");
                close.textContent = "×";
                chip.appendChild(close);
                chipGroupArea.appendChild(chip);
                chipGroupArea.hidden = false;
            }

            function renderSelectedChips() {
                if (!chipsRoot) return;
                const constructInputs = constructSection ? Array.from(constructSection.querySelectorAll('input[type="checkbox"]')) : [];
                const dnInputs = dnSection ? Array.from(dnSection.querySelectorAll('input[type="checkbox"]')) : [];
                const countryInputs = countrySection ? Array.from(countrySection.querySelectorAll('input[type="checkbox"]')) : [];

                addCheckboxChips(chipGroupConstruct, constructInputs, "construct");
                addCheckboxChips(chipGroupDn, dnInputs, "dn");
                addCheckboxChips(chipGroupCountry, countryInputs, "country");
                renderAreaChip();
            }

            const rangeControllers = [];

            blocks.forEach(function (block) {
                const minInput = block.querySelector(".range-input--min");
                const maxInput = block.querySelector(".range-input--max");
                const minRange = block.querySelector(".price-range__input--min");
                const maxRange = block.querySelector(".price-range__input--max");
                const fill = block.querySelector(".price-range__fill");
                if (!minInput || !maxInput || !minRange || !maxRange || !fill) return;

                const minLimit = Number(minRange.min);
                const maxLimit = Number(minRange.max);

                function updateFill() {
                    const left = ((Number(minRange.value) - minLimit) / (maxLimit - minLimit)) * 100;
                    const right = ((Number(maxRange.value) - minLimit) / (maxLimit - minLimit)) * 100;
                    fill.style.left = left + "%";
                    fill.style.width = Math.max(0, right - left) + "%";
                }

                function syncFromRanges() {
                    minInput.value = minRange.value;
                    maxInput.value = maxRange.value;
                    updateFill();
                    renderSelectedChips();
                }

                minRange.addEventListener("input", function () {
                    if (Number(minRange.value) > Number(maxRange.value)) {
                        minRange.value = maxRange.value;
                    }
                    syncFromRanges();
                });

                maxRange.addEventListener("input", function () {
                    if (Number(maxRange.value) < Number(minRange.value)) {
                        maxRange.value = minRange.value;
                    }
                    syncFromRanges();
                });

                minInput.addEventListener("change", function () {
                    const parsed = parseNumber(minInput.value);
                    const next = parsed === null ? minLimit : clamp(parsed, minLimit, Number(maxRange.value));
                    minRange.value = String(next);
                    syncFromRanges();
                });

                maxInput.addEventListener("change", function () {
                    const parsed = parseNumber(maxInput.value);
                    const next = parsed === null ? maxLimit : clamp(parsed, Number(minRange.value), maxLimit);
                    maxRange.value = String(next);
                    syncFromRanges();
                });

                syncFromRanges();

                rangeControllers.push({
                    reset: function () {
                        minRange.value = minRange.defaultValue;
                        maxRange.value = maxRange.defaultValue;
                        syncFromRanges();
                    },
                });
            });

            if (resetButton) {
                resetButton.addEventListener("click", function () {
                    const checkboxes = filtersRoot.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(function (checkbox) {
                        checkbox.checked = false;
                    });

                    rangeControllers.forEach(function (controller) {
                        controller.reset();
                    });

                    renderSelectedChips();
                });
            }

            filtersRoot.addEventListener("change", function (event) {
                const target = event.target;
                if (!(target instanceof HTMLInputElement)) return;
                if (target.type === "checkbox") {
                    renderSelectedChips();
                }
            });

            if (chipsRoot) {
                chipsRoot.addEventListener("click", function (event) {
                    const closeButton = event.target.closest(".catalog-chip__close");
                    if (!closeButton) return;

                    const chip = closeButton.closest(".catalog-chip");
                    if (!chip) return;

                    const targetInputId = chip.dataset.targetInput;
                    if (targetInputId) {
                        const input = document.getElementById(targetInputId);
                        if (input && input instanceof HTMLInputElement && input.type === "checkbox") {
                            input.checked = false;
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                        return;
                    }

                    if (chip.dataset.rangeGroup === "area" && areaSection) {
                        const minRange = areaSection.querySelector(".price-range__input--min");
                        const maxRange = areaSection.querySelector(".price-range__input--max");
                        const minInput = areaSection.querySelector(".range-input--min");
                        const maxInput = areaSection.querySelector(".range-input--max");
                        if (minRange && maxRange && minInput && maxInput) {
                            minRange.value = minRange.defaultValue;
                            maxRange.value = maxRange.defaultValue;
                            minInput.value = minRange.value;
                            maxInput.value = maxRange.value;
                            minRange.dispatchEvent(new Event("input", { bubbles: true }));
                        }
                    }
                });
            }

            renderSelectedChips();
        })();

        (function () {
            const sortButtons = Array.from(document.querySelectorAll(".catalog__sort-item"));
            const catalogGrid = document.querySelector(".catalog__content");
            const catalogSection = document.querySelector(".catalog");
            const header = document.querySelector(".header");
            const perPageSelect = document.querySelector("#catalog-per-page");
            const paginationRoot = document.querySelector(".pagination");
            if (!sortButtons.length || !catalogGrid) return;

            const resetButton = document.querySelector(".catalog__filters-reset");
            const priceFilterBlock = document.querySelector(".filter--price");
            const priceMinRange = priceFilterBlock ? priceFilterBlock.querySelector(".price-range__input--min") : null;
            const priceMaxRange = priceFilterBlock ? priceFilterBlock.querySelector(".price-range__input--max") : null;
            const priceMinInput = priceFilterBlock ? priceFilterBlock.querySelector(".range-input--min") : null;
            const priceMaxInput = priceFilterBlock ? priceFilterBlock.querySelector(".range-input--max") : null;
            const collator = new Intl.Collator("ru", { numeric: true, sensitivity: "base" });
            let currentSort = "popularity";
            let currentPage = 1;
            let popularityRandomOrder = null;

            function scrollToCatalogStart() {
                if (!catalogSection) return;
                const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                const headerOffset = header ? header.getBoundingClientRect().height : 0;
                const targetTop = window.scrollY + catalogSection.getBoundingClientRect().top - headerOffset - 12;

                window.scrollTo({
                    top: Math.max(0, targetTop),
                    behavior: reduceMotion ? "auto" : "smooth"
                });
            }

            function getPerPage() {
                if (!perPageSelect) return 24;
                const parsed = parseInt(perPageSelect.value, 10);
                return Number.isNaN(parsed) ? 24 : parsed;
            }

            function parsePrice(card) {
                const priceEl = card.querySelector(".product-card__price");
                if (!priceEl) return 0;
                const numeric = priceEl.textContent.replace(/[^\d]/g, "");
                return Number(numeric) || 0;
            }

            function parseName(card) {
                const titleEl = card.querySelector(".product-card__title");
                return titleEl ? titleEl.textContent.trim() : "";
            }

            function parseOrders(card) {
                const value = Number(card.dataset.orders);
                return Number.isFinite(value) ? value : 0;
            }

            function randomize(cards) {
                const copy = cards.slice();
                for (let i = copy.length - 1; i > 0; i -= 1) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const temp = copy[i];
                    copy[i] = copy[j];
                    copy[j] = temp;
                }
                return copy;
            }

            function render(cards) {
                cards.forEach(function (card) {
                    catalogGrid.appendChild(card);
                });
            }

            function renderPagination(totalPages) {
                if (!paginationRoot) return;
                paginationRoot.innerHTML = "";

                for (let page = 1; page <= totalPages; page += 1) {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "pagination__item" + (page === currentPage ? " is-active" : "");
                    button.textContent = String(page);
                    button.addEventListener("click", function () {
                        currentPage = page;
                        updateCatalogView();
                        scrollToCatalogStart();
                    });
                    paginationRoot.appendChild(button);
                }
            }

            function setActiveButton(activeButton) {
                sortButtons.forEach(function (button) {
                    button.classList.toggle("is-active", button === activeButton);
                });
            }

            function sortCardsArray(cards, mode) {
                const sorted = cards.slice();

                if (mode === "price") {
                    sorted.sort(function (a, b) {
                        return parsePrice(a) - parsePrice(b);
                    });
                } else if (mode === "name") {
                    sorted.sort(function (a, b) {
                        return collator.compare(parseName(a), parseName(b));
                    });
                } else if (mode === "popularity") {
                    const allZero = cards.every(function (card) {
                        return parseOrders(card) === 0;
                    });
                    if (allZero) {
                        const invalidOrder =
                            !Array.isArray(popularityRandomOrder) ||
                            popularityRandomOrder.length !== cards.length ||
                            popularityRandomOrder.some(function (card) {
                                return cards.indexOf(card) === -1;
                            });
                        if (invalidOrder) {
                            popularityRandomOrder = randomize(cards);
                        }
                        sorted.splice(0, sorted.length, ...popularityRandomOrder);
                    } else {
                        sorted.sort(function (a, b) {
                            return parseOrders(b) - parseOrders(a);
                        });
                    }
                }

                return sorted;
            }

            function getFilteredCards(cards) {
                if (!priceMinRange || !priceMaxRange) return cards.slice();
                const min = Number(priceMinRange.value);
                const max = Number(priceMaxRange.value);
                return cards.filter(function (card) {
                    const price = parsePrice(card);
                    return price >= min && price <= max;
                });
            }

            function updateCatalogView() {
                const allCards = Array.from(catalogGrid.querySelectorAll(".product-card"));
                const sorted = sortCardsArray(allCards, currentSort);
                render(sorted);

                const filtered = getFilteredCards(sorted);
                const perPage = getPerPage();
                const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
                currentPage = Math.min(currentPage, totalPages);

                const start = (currentPage - 1) * perPage;
                const end = start + perPage;
                const pageCards = filtered.slice(start, end);
                const visibleCards = new Set(pageCards);

                sorted.forEach(function (card) {
                    card.style.display = visibleCards.has(card) ? "" : "none";
                });

                renderPagination(totalPages);
            }

            sortButtons.forEach(function (button) {
                button.addEventListener("click", function () {
                    currentSort = button.dataset.sort || "popularity";
                    if (currentSort === "popularity") {
                        popularityRandomOrder = null;
                    }
                    currentPage = 1;
                    setActiveButton(button);
                    updateCatalogView();
                });
            });

            if (perPageSelect) {
                perPageSelect.addEventListener("change", function () {
                    currentPage = 1;
                    updateCatalogView();
                });
            }

            const defaultButton = sortButtons.find(function (button) {
                return button.dataset.sort === "popularity";
            });
            if (defaultButton) {
                setActiveButton(defaultButton);
                currentSort = "popularity";
            }

            if (priceMinRange && priceMaxRange) {
                priceMinRange.addEventListener("input", function () {
                    currentPage = 1;
                    updateCatalogView();
                });
                priceMaxRange.addEventListener("input", function () {
                    currentPage = 1;
                    updateCatalogView();
                });
            }

            if (priceMinInput && priceMaxInput) {
                priceMinInput.addEventListener("change", function () {
                    currentPage = 1;
                    updateCatalogView();
                });
                priceMaxInput.addEventListener("change", function () {
                    currentPage = 1;
                    updateCatalogView();
                });
            }

            if (resetButton) {
                resetButton.addEventListener("click", function () {
                    currentPage = 1;
                    requestAnimationFrame(updateCatalogView);
                });
            }

            updateCatalogView();
        })();

        (function () {
            const catalogGrid = document.querySelector(".catalog__content");
            const viewButtons = Array.from(document.querySelectorAll(".view-button[data-view]"));
            if (!catalogGrid || !viewButtons.length) return;

            function setView(mode) {
                const isList = mode === "list";
                catalogGrid.classList.toggle("is-list", isList);

                viewButtons.forEach(function (button) {
                    const active = button.dataset.view === mode;
                    button.classList.toggle("is-active", active);
                });
            }

            viewButtons.forEach(function (button) {
                button.addEventListener("click", function () {
                    setView(button.dataset.view === "list" ? "list" : "grid");
                });
            });

            setView("grid");
        })();

        (function () {
            const catalogMenuLink = document.querySelector(".menu__link--catalog");
            const catalogSection = document.querySelector("#catalog");
            const header = document.querySelector(".header");
            if (!catalogMenuLink || !catalogSection) return;

            function scrollToCatalogStart() {
                const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                const headerOffset = header ? header.getBoundingClientRect().height : 0;
                const targetTop = window.scrollY + catalogSection.getBoundingClientRect().top - headerOffset - 12;

                window.scrollTo({
                    top: Math.max(0, targetTop),
                    behavior: reduceMotion ? "auto" : "smooth"
                });
            }

            catalogMenuLink.addEventListener("click", function (event) {
                event.preventDefault();
                scrollToCatalogStart();
            });
        })();

        (function () {
            const faqItems = Array.from(document.querySelectorAll(".faq__item"));
            if (!faqItems.length) return;

            const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
            const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
            const DURATION_MS = 690;

            function cleanup(details) {
                details.style.height = "";
                details.style.overflow = "";
                details.style.transition = "";
                details.classList.remove("is-collapsing");
                details.dataset.animating = "false";
            }

            function expand(details, summary) {
                if (reducedMotion.matches) {
                    details.open = true;
                    return;
                }

                details.dataset.animating = "true";
                details.classList.remove("is-collapsing");

                const startHeight = summary.offsetHeight;
                details.style.height = startHeight + "px";
                details.style.overflow = "hidden";

                details.open = true;
                details.style.height = "auto";
                const endHeight = details.offsetHeight;

                details.style.height = startHeight + "px";
                details.offsetHeight;
                details.style.transition = "height " + DURATION_MS + "ms " + EASING;
                details.style.height = endHeight + "px";

                let finished = false;
                const onEnd = function (event) {
                    if (finished) return;
                    if (event.propertyName !== "height") return;
                    finished = true;
                    details.removeEventListener("transitionend", onEnd);
                    cleanup(details);
                };

                details.addEventListener("transitionend", onEnd);
                window.setTimeout(function () {
                    if (finished) return;
                    finished = true;
                    details.removeEventListener("transitionend", onEnd);
                    cleanup(details);
                }, DURATION_MS + 80);
            }

            function collapse(details, summary) {
                if (reducedMotion.matches) {
                    details.open = false;
                    return;
                }

                details.dataset.animating = "true";
                details.classList.add("is-collapsing");

                const startHeight = details.offsetHeight;
                const endHeight = summary.offsetHeight;

                details.style.height = startHeight + "px";
                details.style.overflow = "hidden";
                details.offsetHeight;
                details.style.transition = "height " + DURATION_MS + "ms " + EASING;
                details.style.height = endHeight + "px";

                let finished = false;
                const onEnd = function (event) {
                    if (finished) return;
                    if (event.propertyName !== "height") return;
                    finished = true;
                    details.removeEventListener("transitionend", onEnd);
                    details.open = false;
                    cleanup(details);
                };

                details.addEventListener("transitionend", onEnd);
                window.setTimeout(function () {
                    if (finished) return;
                    finished = true;
                    details.removeEventListener("transitionend", onEnd);
                    details.open = false;
                    cleanup(details);
                }, DURATION_MS + 80);
            }

            faqItems.forEach(function (details) {
                const summary = details.querySelector(".faq__question");
                if (!summary) return;

                details.dataset.animating = "false";

                summary.addEventListener("click", function (event) {
                    event.preventDefault();
                    if (details.dataset.animating === "true") return;

                    if (details.open) {
                        collapse(details, summary);
                    } else {
                        expand(details, summary);
                    }
                });
            });
        })();

        (function () {
            const viewport = document.querySelector(".reviews__viewport");
            const track = document.querySelector(".reviews__track");
            const nextButton = document.querySelector(".reviews__arrow--next");
            const prevButton = document.querySelector(".reviews__arrow--prev");
            if (!viewport || !track || !nextButton || !prevButton) return;

            const TRANSITION_MS = 480;
            const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
            const GAP = 24;
            const MAX_VISIBLE = 4;
            const AUTOPLAY_DELAY_MS = 5000;
            const originals = Array.from(track.querySelectorAll(".review-card"));
            if (originals.length < 2) return;

            const cloneCount = Math.min(MAX_VISIBLE, originals.length);
            let currentIndex = cloneCount;
            let animating = false;
            let slideWidth = 0;
            let finalizeTimer = null;
            let autoplayTimer = null;

            const headFragment = document.createDocumentFragment();
            const tailFragment = document.createDocumentFragment();

            originals.slice(-cloneCount).forEach(function (card) {
                const clone = card.cloneNode(true);
                clone.setAttribute("aria-hidden", "true");
                headFragment.appendChild(clone);
            });

            originals.slice(0, cloneCount).forEach(function (card) {
                const clone = card.cloneNode(true);
                clone.setAttribute("aria-hidden", "true");
                tailFragment.appendChild(clone);
            });

            track.insertBefore(headFragment, originals[0]);
            track.appendChild(tailFragment);

            const slides = Array.from(track.querySelectorAll(".review-card"));

            function getVisibleCount() {
                const width = window.innerWidth;
                if (width <= 767) return 1;
                if (width <= 991) return 2;
                return 4;
            }

            function setSlidesWidth() {
                const visible = getVisibleCount();
                const viewportWidth = viewport.clientWidth;
                slideWidth = (viewportWidth - GAP * (visible - 1)) / visible;
                slides.forEach(function (slide) {
                    slide.style.width = slideWidth + "px";
                });
            }

            function moveTo(index, withTransition) {
                const shift = index * (slideWidth + GAP);
                track.style.transition = withTransition ? "transform " + TRANSITION_MS + "ms " + EASING : "none";
                track.style.transform = "translateX(-" + shift + "px)";
            }

            function syncWithoutAnimation(index) {
                currentIndex = index;
                moveTo(currentIndex, false);
            }

            function go(direction) {
                if (animating) return;
                animating = true;
                currentIndex += direction;
                moveTo(currentIndex, true);

                if (finalizeTimer) {
                    window.clearTimeout(finalizeTimer);
                }
                finalizeTimer = window.setTimeout(function () {
                    finalizeTimer = null;
                    finalizeLoopPosition();
                }, TRANSITION_MS + 80);
            }

            function startAutoplay() {
                if (autoplayTimer) {
                    window.clearInterval(autoplayTimer);
                }
                autoplayTimer = window.setInterval(function () {
                    go(1);
                }, AUTOPLAY_DELAY_MS);
            }

            function resetAutoplay() {
                startAutoplay();
            }

            function finalizeLoopPosition() {
                if (currentIndex >= originals.length + cloneCount) {
                    syncWithoutAnimation(currentIndex - originals.length);
                } else if (currentIndex < cloneCount) {
                    syncWithoutAnimation(currentIndex + originals.length);
                }
                animating = false;
            }

            track.addEventListener("transitionend", function (event) {
                if (event.target !== track) return;
                if (event.propertyName !== "transform") return;
                if (finalizeTimer) {
                    window.clearTimeout(finalizeTimer);
                    finalizeTimer = null;
                }
                finalizeLoopPosition();
            });

            nextButton.addEventListener("click", function () {
                go(1);
                resetAutoplay();
            });

            prevButton.addEventListener("click", function () {
                go(-1);
                resetAutoplay();
            });

            window.addEventListener("resize", function () {
                if (finalizeTimer) {
                    window.clearTimeout(finalizeTimer);
                    finalizeTimer = null;
                }
                animating = false;
                setSlidesWidth();
                moveTo(currentIndex, false);
                resetAutoplay();
            });

            document.addEventListener("visibilitychange", function () {
                if (document.hidden) {
                    if (autoplayTimer) {
                        window.clearInterval(autoplayTimer);
                        autoplayTimer = null;
                    }
                    return;
                }
                resetAutoplay();
            });

            setSlidesWidth();
            moveTo(currentIndex, false);
            startAutoplay();
        })();

        (function () {
            const skillsRoot = document.querySelector(".manager-card__skills");
            if (!skillsRoot) return;

            const skillButtons = Array.from(skillsRoot.querySelectorAll(".manager-card__skill[data-skill-message]"));
            const popup = skillsRoot.querySelector(".manager-card__skill-popup");
            const popupText = popup ? popup.querySelector(".manager-card__skill-popup-text") : null;
            const popupClose = popup ? popup.querySelector(".manager-card__skill-popup-close") : null;
            if (!skillButtons.length || !popup || !popupText || !popupClose) return;

            const POPUP_ANIMATION_MS = 320;
            let activeButton = null;
            let closeTimer = null;
            let switchTimer = null;

            function positionPopupByButton(button) {
                const rootRect = skillsRoot.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                const anchorX = buttonRect.left - rootRect.left + buttonRect.width / 2;
                const popupWidth = popup.offsetWidth || 360;

                let popupLeft = anchorX - 24;
                const minLeft = -24;
                const maxLeft = Math.max(minLeft, skillsRoot.clientWidth - popupWidth + 24);
                popupLeft = Math.min(maxLeft, Math.max(minLeft, popupLeft));

                let caretLeft = anchorX - popupLeft - 8;
                caretLeft = Math.max(8, Math.min(popupWidth - 24, caretLeft));

                popup.style.left = popupLeft + "px";
                popup.style.setProperty("--popup-caret-left", caretLeft + "px");
            }

            function setExpandedState(active) {
                skillButtons.forEach(function (button) {
                    button.setAttribute("aria-expanded", button === active ? "true" : "false");
                });
            }

            function clearTimers() {
                if (closeTimer) {
                    window.clearTimeout(closeTimer);
                    closeTimer = null;
                }
                if (switchTimer) {
                    window.clearTimeout(switchTimer);
                    switchTimer = null;
                }
            }

            function closePopup() {
                if (popup.hidden) return;
                popup.classList.remove("is-open");
                popup.classList.add("is-closing");
                clearTimers();
                closeTimer = window.setTimeout(function () {
                    popup.hidden = true;
                    popup.classList.remove("is-closing");
                    closeTimer = null;
                }, POPUP_ANIMATION_MS);

                setExpandedState(null);
                activeButton = null;
            }

            function applyPopupContent(button) {
                const message = button.dataset.skillMessage || "";
                popupText.textContent = message;
                positionPopupByButton(button);
                setExpandedState(button);
                activeButton = button;
            }

            function openPopup(button) {
                clearTimers();
                popup.hidden = false;
                popup.classList.remove("is-closing");
                applyPopupContent(button);

                if (!popup.classList.contains("is-open")) {
                    popup.classList.remove("is-open");
                    window.requestAnimationFrame(function () {
                        popup.classList.add("is-open");
                    });
                }
            }

            function switchPopup(button) {
                clearTimers();
                popup.classList.remove("is-open");
                popup.classList.add("is-closing");
                setExpandedState(null);

                switchTimer = window.setTimeout(function () {
                    popup.classList.remove("is-closing");
                    popup.hidden = false;
                    applyPopupContent(button);
                    window.requestAnimationFrame(function () {
                        popup.classList.add("is-open");
                    });
                    switchTimer = null;
                }, POPUP_ANIMATION_MS);
            }

            skillButtons.forEach(function (button) {
                button.setAttribute("aria-expanded", "false");
                button.addEventListener("click", function () {
                    if (activeButton === button && !popup.hidden) {
                        closePopup();
                        return;
                    }
                    if (activeButton && activeButton !== button && !popup.hidden) {
                        switchPopup(button);
                        return;
                    }
                    openPopup(button);
                });
            });

            popupClose.addEventListener("click", function () {
                closePopup();
            });

            document.addEventListener("click", function (event) {
                if (popup.hidden) return;
                if (skillsRoot.contains(event.target)) return;
                closePopup();
            });

            document.addEventListener("keydown", function (event) {
                if (event.key === "Escape" && !popup.hidden) {
                    closePopup();
                }
            });

            window.addEventListener("resize", function () {
                if (!popup.hidden && activeButton) {
                    positionPopupByButton(activeButton);
                }
            });
        })();

        (function () {
            const tabsRoot = document.querySelector(".product-tabs");
            if (!tabsRoot) return;

            const buttons = Array.from(tabsRoot.querySelectorAll(".product-tabs__btn[data-tab]"));
            const panels = Array.from(tabsRoot.querySelectorAll(".tab-panel[id]"));
            if (!buttons.length || !panels.length) return;

            function setActiveTab(tabId) {
                buttons.forEach(function (button) {
                    const isActive = button.dataset.tab === tabId;
                    button.classList.toggle("is-active", isActive);
                    button.setAttribute("aria-selected", isActive ? "true" : "false");
                });

                panels.forEach(function (panel) {
                    panel.classList.toggle("is-active", panel.id === tabId);
                });
            }

            tabsRoot.addEventListener("click", function (event) {
                const button = event.target.closest(".product-tabs__btn[data-tab]");
                if (!button || !tabsRoot.contains(button)) return;
                setActiveTab(button.dataset.tab);
            });
        })();

        (function () {
            const root = document.querySelector(".selection");
            if (!root) return;

            const dropdowns = Array.from(root.querySelectorAll("[data-field-dropdown]"));
            if (!dropdowns.length) return;

            function closeAll(except) {
                dropdowns.forEach(function (dropdown) {
                    if (dropdown === except) return;
                    dropdown.classList.remove("is-open");
                });
            }

            dropdowns.forEach(function (dropdown) {
                const toggle = dropdown.querySelector("[data-field-toggle]");
                const options = Array.from(dropdown.querySelectorAll("[data-value]"));
                if (!toggle || !options.length) return;

                toggle.addEventListener("click", function (event) {
                    event.stopPropagation();
                    const isOpen = dropdown.classList.contains("is-open");
                    closeAll(dropdown);
                    dropdown.classList.toggle("is-open", !isOpen);
                });

                options.forEach(function (option) {
                    option.addEventListener("click", function () {
                        const value = option.dataset.value || option.textContent.trim();
                        toggle.textContent = value;
                        dropdown.classList.remove("is-open");
                    });
                });
            });

            document.addEventListener("click", function (event) {
                if (event.target.closest("[data-field-dropdown]")) return;
                closeAll();
            });
        })();

        (function () {
            const roots = Array.from(document.querySelectorAll(".related-products"));
            if (!roots.length) return;

            roots.forEach(function (root) {
                const slider = root.querySelector(".related-products__slider");
                const track = root.querySelector(".related-products__track");
                const prevButton = root.querySelector(".related-products__arrow--prev");
                const nextButton = root.querySelector(".related-products__arrow--next");
                if (!slider || !track || !prevButton || !nextButton) return;

                const originalSlides = Array.from(track.querySelectorAll(".related-products__slide"));
                const originalCount = originalSlides.length;
                if (!originalCount) return;

                const cloneCount = originalCount;
                const leadingClones = originalSlides.slice(-cloneCount).map(function (slide) {
                    const clone = slide.cloneNode(true);
                    clone.classList.add("related-products__slide--clone");
                    return clone;
                });
                const trailingClones = originalSlides.slice(0, cloneCount).map(function (slide) {
                    const clone = slide.cloneNode(true);
                    clone.classList.add("related-products__slide--clone");
                    return clone;
                });

                leadingClones.forEach(function (clone) {
                    track.insertBefore(clone, track.firstChild);
                });
                trailingClones.forEach(function (clone) {
                    track.appendChild(clone);
                });

                let index = cloneCount;
                let isAnimating = false;

                function getSlideWidth() {
                    const slide = track.querySelector(".related-products__slide");
                    return slide ? slide.getBoundingClientRect().width : 0;
                }

                function setPosition(withAnimation) {
                    track.style.transition = withAnimation ? "transform 0.4s ease" : "none";
                    track.style.transform = "translateX(" + -(index * getSlideWidth()) + "px)";
                }

                function jumpTo(newIndex) {
                    index = newIndex;
                    track.style.transition = "none";
                    track.style.transform = "translateX(" + -(index * getSlideWidth()) + "px)";
                    track.getBoundingClientRect();
                    track.style.transition = "transform 0.4s ease";
                }

                function go(step) {
                    if (isAnimating) return;
                    isAnimating = true;
                    index += step;
                    setPosition(true);
                }

                nextButton.addEventListener("click", function () {
                    go(1);
                });

                prevButton.addEventListener("click", function () {
                    go(-1);
                });

                track.addEventListener("transitionend", function (event) {
                    if (event.target !== track) return;
                    if (event.propertyName !== "transform") return;

                    if (index >= originalCount + cloneCount) {
                        jumpTo(index - originalCount);
                    } else if (index < cloneCount) {
                        jumpTo(index + originalCount);
                    }

                    isAnimating = false;
                });

                window.addEventListener("resize", function () {
                    setPosition(false);
                });

                setPosition(false);
            });
        })();

        (function () {
            const groups = [
                ".breadcrumbs",
                ".page-heading",
                ".selection-banner__manager",
                ".selection-banner__main",
                ".manager-card > *",
                ".selection-content__benefit",
                ".selection-content__title",
                ".selection-content__text",
                ".selection-content__button",
                ".selection-content__note",
                ".special-offer",
                ".catalog",
                ".faq",
                ".advantages",
                ".reviews",
                ".product-card",
                ".faq__item",
                ".advantages__item",
                ".review-card"
            ];

            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const elements = [];
            const seen = new Set();

            groups.forEach(function (selector) {
                const nodes = document.querySelectorAll(selector);
                nodes.forEach(function (node, index) {
                    if (seen.has(node)) return;
                    seen.add(node);
                    node.classList.add("reveal-on-scroll");
                    node.style.transitionDelay = Math.min(index % 6, 5) * 70 + "ms";
                    elements.push(node);
                });
            });

            if (!elements.length) return;

            if (reduceMotion) {
                elements.forEach(function (element) {
                    element.classList.add("is-visible");
                });
                return;
            }

            function isInitiallyInViewport(element) {
                const rect = element.getBoundingClientRect();
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                return rect.bottom > 0 && rect.top < viewportHeight * 0.98;
            }

            const initiallyVisible = elements.filter(isInitiallyInViewport);
            initiallyVisible.forEach(function (element) {
                element.dataset.revealBoot = "1";
            });

            const observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.target.dataset.revealBoot === "1") return;
                    entry.target.classList.toggle("is-visible", entry.isIntersecting);
                });
            }, {
                root: null,
                rootMargin: "0px",
                threshold: 0.01
            });

            elements.forEach(function (element) {
                observer.observe(element);
            });

            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () {
                    initiallyVisible.forEach(function (element, index) {
                        window.setTimeout(function () {
                            element.classList.add("is-visible");
                            delete element.dataset.revealBoot;
                        }, index * 60);
                    });
                });
            });
        })();



