const { googleBooksApiKey } = require('./vars.json');
const axios = require('axios');
const fs = require('fs');
const { parse } = require('papaparse');

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

const appendFile = (...args) => {
    return new Promise((resolve, reject) => {
        fs.appendFile(...args, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        })
    })
}

(async () => {
    const rawBookData = await readFile('./books.tsv', 'utf8').catch(error => console.log(error));
    const books = rawBookData.split('\n').splice(1, rawBookData.length - 1).map(item => {
        const row = item.split('\t');
        return {
            description: row[2],
            title: row[3],
            author: row[4]
        };
    });
    const promises = [books[2]].map(async (book) => {
        const info = await getBookInfo(book.title);
        const saleInfo = info.items.find(item => {
            return item.saleInfo.saleability === 'FOR_SALE';
        });
        return {
            ...book,
            price: saleInfo.saleInfo.listPrice.amount,
            url: saleInfo.saleInfo.buyLink
        }
    });
    const results = await Promise.all(promises);
    console.log(results)
})();
