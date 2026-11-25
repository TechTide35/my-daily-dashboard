
// ==========================================
// MY DAILY DASHBOARD
// BOOKMARKS COMPONENT
// ==========================================

// Load saved bookmarks from browser storage.

let bookmarks = [];

try {

  bookmarks = JSON.parse(
    localStorage.getItem("myDashboardBookmarks")
  ) || [];

  if (!Array.isArray(bookmarks)) {
    bookmarks = [];
  }

} catch (error) {

  console.error("Unable to load bookmarks:", error);

  bookmarks = [];
}


// ==========================================
// SAVE BOOKMARKS
// ==========================================

function saveBookmarks() {

  try {

    localStorage.setItem(
      "myDashboardBookmarks",
      JSON.stringify(bookmarks)
    );

    return true;

  } catch (error) {

    console.error("Unable to save bookmarks:", error);

    updateBookmarkStatus(
      "Unable to save bookmarks in this browser."
    );

    return false;
  }
}


// ==========================================
// ADD BOOKMARK
// ==========================================

function addBookmark() {

  const nameInput =
    document.getElementById("bookmark-name");

  const urlInput =
    document.getElementById("bookmark-url");

  const name = nameInput.value.trim();

  let url = urlInput.value.trim();

  if (!name || !url) {

    updateBookmarkStatus(
      "Please enter both a website name and URL."
    );

    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  try {

    const parsedURL = new URL(url);

    if (
      !["http:", "https:"].includes(parsedURL.protocol) ||
      !parsedURL.hostname.includes(".")
    ) {
      throw new Error("Invalid website address.");
    }

    url = parsedURL.href;

  } catch (error) {

    updateBookmarkStatus(
      "Please enter a valid website address."
    );

    return;
  }

  bookmarks.push({
    id: Date.now().toString() +
        Math.random().toString(36).slice(2),

    name: name,

    url: url
  });

  if (!saveBookmarks()) {

    bookmarks.pop();

    return;
  }

  nameInput.value = "";
  urlInput.value = "";

  displayBookmarks();

  updateBookmarkStatus("Bookmark added successfully.");
}


// ==========================================
// DISPLAY BOOKMARKS
// ==========================================

function displayBookmarks() {

  const container =
    document.getElementById("bookmarks-list");

  if (!container) return;

  container.innerHTML = "";

  if (bookmarks.length === 0) {

    const message = document.createElement("p");

    message.textContent =
      "No bookmarks yet. Add your favorite websites above.";

    message.className = "placeholder";

    container.appendChild(message);

    return;
  }

  bookmarks.forEach(bookmark => {

    const item = document.createElement("div");

    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.justifyContent = "space-between";
    item.style.flexWrap = "wrap";
    item.style.gap = "10px";
    item.style.padding = "10px 0";
    item.style.borderBottom = "1px solid #293b53";

    // Website link

    const link = document.createElement("a");

    link.textContent = bookmark.name;

    link.href = bookmark.url;

    link.target = "_blank";

    link.rel = "noopener noreferrer";

    link.style.color = "#3995f7";
    link.style.textDecoration = "none";

    item.appendChild(link);

    // Edit button

    const controls = document.createElement("div");

    const editButton = document.createElement("button");

    editButton.textContent = "Edit";

    editButton.className = "refresh-button";

    editButton.style.marginRight = "6px";

    editButton.onclick = () => editBookmark(bookmark.id);

    controls.appendChild(editButton);

    // Delete button

    const deleteButton = document.createElement("button");

    deleteButton.textContent = "Delete";

    deleteButton.className = "refresh-button";

    deleteButton.onclick = () => deleteBookmark(bookmark.id);

    controls.appendChild(deleteButton);

    item.appendChild(controls);

    container.appendChild(item);

  });

}


// ==========================================
// EDIT BOOKMARK
// ==========================================

function editBookmark(id) {

  const bookmark = bookmarks.find(
    item => item.id === id
  );

  if (!bookmark) return;

  const newName = prompt(
    "Enter the new website name:",
    bookmark.name
  );

  if (newName === null) return;

  const newURL = prompt(
    "Enter the new website URL:",
    bookmark.url
  );

  if (newURL === null) return;

  const name = newName.trim();

  let url = newURL.trim();

  if (!name || !url) {

    updateBookmarkStatus(
      "Website name and URL cannot be empty."
    );

    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  try {

    const parsedURL = new URL(url);

    if (
      !["https:", "http:"].includes(parsedURL.protocol) ||
      !parsedURL.hostname.includes(".")
    ) {
      throw new Error("Invalid URL.");
    }

    url = parsedURL.href;

  } catch (error) {

    updateBookmarkStatus(
      "Please enter a valid website URL."
    );

    return;
  }

  const oldName = bookmark.name;
  const oldURL = bookmark.url;

  bookmark.name = name;
  bookmark.url = url;

  if (!saveBookmarks()) {

    bookmark.name = oldName;
    bookmark.url = oldURL;

    return;
  }

  displayBookmarks();

  updateBookmarkStatus("Bookmark updated successfully.");
}


// ==========================================
// DELETE BOOKMARK
// ==========================================

function deleteBookmark(id) {

  const confirmed = confirm(
    "Are you sure you want to delete this bookmark?"
  );

  if (!confirmed) return;

  const oldBookmarks = [...bookmarks];

  bookmarks = bookmarks.filter(
    item => item.id !== id
  );

  if (!saveBookmarks()) {

    bookmarks = oldBookmarks;

    return;
  }

  displayBookmarks();

  updateBookmarkStatus("Bookmark deleted.");
}


// ==========================================
// UPDATE STATUS MESSAGE
// ==========================================

function updateBookmarkStatus(message) {

  const status =
    document.getElementById("bookmarks-status");

  if (status) {
    status.textContent = message;
  }

}


// ==========================================
// INITIALIZE BOOKMARKS
// ==========================================

displayBookmarks();

updateBookmarkStatus(
  "Your bookmarks are saved automatically."
);
