const express = require('express')
const app = express()
const mysql = require('mysql2');
const multer = require('multer');
const xlsx = require('xlsx');
const bodyParser = require('body-parser');
require('dotenv').config();
const upload = multer({ dest: 'uploads/' });
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }));

const connection = mysql.createConnection({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,
});

connection.connect();

app.post('/upload', upload.single('excelFile'), (req, res) => {
    try {
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        // 전체 데이터를 일괄 삽입하기 위한 쿼리 및 값 배열 준비
        let query = 'INSERT INTO skku (prefab_id, con_id, prefab_position_x, prefab_position_y, prefab_position_z, sp_position_x, sp_position_y, sp_position_z, rebar_position_x, rebar_position_y, rebar_position_z) VALUES ?';
        let values = data.map(row => [
            row.prefab_id, 
            row.con_id, 
            row.prefab_position_x, 
            row.prefab_position_y, 
            row.prefab_position_z, 
            row.sp_position_x, 
            row.sp_position_y, 
            row.sp_position_z, 
            row.rebar_position_x, 
            row.rebar_position_y, 
            row.rebar_position_z
        ]);
        console.log(values)
        // 일괄 삽입 실행
        connection.query(query, [values], (err, result) => {
            if (err) throw err;
            console.log('삽입된 행의 수:', result.affectedRows);
        });

        res.send("<script>alert('데이터 업로드 성공');window.location.replace(`/main`)</script>");
    } catch (error) {
        console.error('에러발생:', error);
        res.status(500).send("<script>alert('서버에러');window.location.replace(`/main`)</script>");
}

  });

app.post('/search', (req, res) => {
    const id = req.body.id; // 폼에서 입력한 ID 값
    const query = 'SELECT * FROM skku WHERE prefab_id = ?'; //수정
    try {
        connection.query(query, [id], (error, results, fields) => {
            if (error) {
                console.error('에러:', error);
                return res.status(500).send('서버에러');
            }

            if (results.length === 0) {
                // ID에 해당하는 데이터가 없을 경우
                console.log(results)
                return res.render('main', { data: null });
            } else {
                console.log(results)
                // ID에 해당하는 데이터를 렌더링
                return res.render('main', { data: results });// 배열로 일부분만 렌더링가능
            }
        });
    } catch (error) {
        console.error('에러발생:', error);
        res.status(500).send("<script>alert('서버에러');window.location.replace(`/main`)</script>");
    }
});

app.post('/delete', (req, res) => {
    const id = req.body.id;
    if (id == "all") {
        const query = 'DELETE FROM skku';
        try {
            connection.query(query, (error, results, fields) => { // [id] 제거
                if (error) {
                    console.error('에러:', error);
                    res.status(500).send('서버에러');
                    return;
                }
                res.send("<script>alert('전체데이터 삭제 성공');window.location.replace(`/main`)</script>");
            });
        } catch (error) {
            console.error('에러발생:', error);
            return res.status(500).send("<script>alert('서버에러');window.location.replace(`/main`)</script>");
        }
    } 
    const query = 'DELETE FROM skku WHERE prefab_id = ?';
    try {
        connection.query(query, [id], (error, results, fields) => {
            if (error) {
                console.error('에러:', error);
                res.status(500).send('서버에러');
                return;
            }
            res.send("<script>alert('데이터 삭제 성공');window.location.replace(`/main`)</script>");
        });
    } catch (error) {
        console.error('에러발생:', error);
        res.status(500).send("<script>alert('서버에러');window.location.replace(`/main`)</script>");
    }
});

// app.post('/delete', (req,res)=>{
//     const id = req.body.id;
//     const query = 'DELETE FROM skku WHERE prefab_id = ?'
//     try {
//         connection.query(query, [id], (error, results, fields) => {
//             if (error) {
//                 console.error('에러:', error);
//                 res.status(500).send('서버에러');
//                 return;
//             }
//             res.render('main', { data: null });// 배열로 일부분만 렌더링가능
//             res.send("<script>alert('데이터 삭제 성공');window.location.replace(`/main`)</script>");

//         });
//     } catch (error) {
//         console.error('에러발생:', error);
//         res.status(500).send("<script>alert('서버에러');window.location.replace(`/main`)</script>");
//     }
// })

app.listen(8080, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
})

app.get('/', (req, res) => {
    res.render('main.ejs', { data: null })
}) 

app.get('/main', (req, res) => {
    res.render('main.ejs', { data: null })
  }) 