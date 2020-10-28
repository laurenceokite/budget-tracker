let db;

const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_budget', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function(event) {
    db = event.target.result;
  
    if (navigator.onLine) {
        uploadBudget();
    }
};
  
request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_budget'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_budget');

    budgetObjectStore.add(record);
}

function uploadBudget() {
    // open a transaction on your db
    const transaction = db.transaction(['new_budget'], 'readwrite');
  
    // access your object store
    const budgetObjectStore = transaction.objectStore('new_budget');
  
    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();
  
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
          fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
              
              const transaction = db.transaction(['new_budget'], 'readwrite');
            
              const budgetObjectStore = transaction.objectStore('new_budget');
              
              budgetObjectStore.clear();
    
              console.log('All saved pizza has been submitted!');
            })
            .catch(err => {
              console.log(err);
            });
        }
    }    
} 

window.addEventListener('online', uploadBudget);