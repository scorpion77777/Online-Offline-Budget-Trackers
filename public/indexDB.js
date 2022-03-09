let db;
let budgetVersion;

const request = indexedDB.open("Budget", budgetVersion || 21);

request.onupgradeneeded = function (e) {
  console.log("There is an upgrade needed in IndexDB");

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.newVersion;

  console.log(`DB updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("BudgetStore", { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`OH NO! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log("check db inititalized");

  let transaction = db.transaction(["BudgetStore"], "readwrite");

  const store = transaction.objectStore("BudgetStore");

  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(["BudgetStore"], "readwrite");

            const currentStore = transaction.objectStore("BudgetStore");

            currentStore.clear();
            console.log("Clearing store!");
          }
        });
    }
  };
}

request.onsuccess = function (event) {
  console.log("success");
  db = event.target.result;

  if (navigator.onLine) {
    console.log("Backend ONLINE!");
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log("Save record initialized");
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  const store = transaction.objectStore("BudgetStore");
  store.add(record);
};

window.addEventListener("online", checkDatabase);
