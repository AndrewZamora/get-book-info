// const { googleBooksApiKey } = require('./vars.json');
const axios = require('axios');
const fs = require('fs');

const exists = (...args) => {
    return new Promise((resolve, reject) => {
        fs.exists(...args, (data) => {
            resolve(data);
        });
    });
}

const readFile = (...args) => {
    return new Promise((resolve, reject) => {
        fs.readFile(...args, (error, data) => {
            if (error) {
                return reject(error);
            }
            resolve(data);
        });
    });
}

const getBookInfo = async (title, countryCode)=> {
    const { data } = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=+intitle:${title}&country=${countryCode}&printType=books`).catch(error => console.log(error));
    return data;
}

const appendFile = (...args) => {
    return new Promise((resolve, reject) => {
        fs.appendFile(...args, (error) => {
            if (error) {
                return reject(error);
            }
            resolve();
        })
    })
}

(async () => {
    const resultsFileExists = await exists('results.csv');
    const limit = 5;
    let offset = null;
    const rawBookData = await readFile('books.tsv', 'utf8').catch(error => console.log(error));
    let books = rawBookData.split('\n').map(item => {
        const row = item.replace(/,|"|'/g, '').split('\t');
        return {
            description: row[2],
            title: row[3],
            author: row[4]
        };
    });
    let booksWithOneAuthor = [];
    for(const book of books) {
        const author = book.author.split(';');
        if(author.length === 1 && author[0].length > 2) {
            booksWithOneAuthor.push(book);
        }
    }
    // console.log(booksWithOneAuthor);
    // if (resultsFileExists) {
    //     const rawResults = await readFile('results.csv', 'utf8').catch(error => console.log(error));
    //     const results = rawResults.split('\n').map(result => result);
    //     if(results.length === books.length + 1){
    //         console.log("FINISHED!");
    //         return
    //     }
    //     offset = results.length - 1;
    // }
    // if (offset) {
    //     books = books.slice(offset);
    // }
    // if(books.length > limit) {
    //     books = books.slice(0, limit);
    // }
    const promises = booksWithOneAuthor.slice(0,6).map(async book => {
        if(book.title === "") {
            return {
                ...book,
                price: "",
                url: ""
            }
        }
        const title = book.title.replace(/[^a-zA-Z0-9 -]/g,"");
        const info = await getBookInfo(title, 'US').catch(err => console.log(err));
        if(info.totalItems === 0) {
            return {
                ...book,
                price: "",
                url: ""
            }
        }
        const authorMatch = info.items.filter(item => {
            if(item.volumeInfo.authors){
                console.log(item.volumeInfo.authors,book.author.toLowerCase())
                return item.volumeInfo.authors.map(author => author.toLowerCase()).includes(book.author.toLowerCase())
            } else {
                return false
            }
        })
        if(authorMatch.length < 1) {
            return {
                ...book,
                price: "",
                url: ""
            }
        }
        console.log("matches",authorMatch);
        const saleInfo = authorMatch.find(item => {
            if (item.saleInfo) {
                console.log(item.volumeInfo.industryIdentifiers)
                return item.saleInfo.saleability === 'FOR_SALE';
            }
        });
        return {
            ...book,
            price: saleInfo ? saleInfo.saleInfo.listPrice.amount : "",
            url: saleInfo ? saleInfo.saleInfo.buyLink : ""
        }
    });
    const results = await Promise.all(promises);
    console.log("results",results)
    // for (let i = 0; i < results.length; i++) {
    //     if (offset === null && i === 0) {
    //         const firstRow = 'Title,Author,Price,Url,Description'
    //         await appendFile('results.csv', firstRow, 'utf8').catch(err => console.log(err));
    //     }
    //     const { title, author, price, url, description } = results[i];
    //     const csvString = `\n${title}, ${author}, ${price}, ${url}, ${description} `
    //     await appendFile('results.csv', csvString, 'utf8').catch(err => console.log(err));
    // }
    // console.log(`This round is finished.`);
})();
