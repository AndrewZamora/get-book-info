const { googleBooksApiKey } = require('./vars.json');
const axios = require('axios');
const fs = require('fs');

const readFile = (...args) => {
    return new Promise((resolve, reject) => {
        fs.readFile(...args, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
}
const getBookInfo = async (title) => {
    const { data } = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${title}`).catch(error => console.log(error));
    return data;
}

(async () => {
    const bookData = await readFile('./books.csv', 'utf8').catch(error => console.log(error));
    console.log(bookData)
    return
    const bookInfo = await getBookInfo("The Kill A Mocking Bird");
    console.log(bookInfo.items[8].saleInfo);
})();
