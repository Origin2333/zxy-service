var express = require('express');
var router = express.Router();
var URL = require('url');
var db = require('../model/db');

function Law() {
    this.id;
    this.name;
    this.content;
}

/* GET law listing. */
router.get('/getLawList', function(req, res, next) {
    var law = new Law();
    var params = URL.parse(req.url, true).query;
    let connection = db.connection();
    // let sql = "select * from law_base where name like '%"+params.name+"%'";
    let sql = 'select distinct id,name from law_base INNER JOIN law_department on law_department.lawId = law_base.id INNER JOIN law_key_word ON law_key_word.lawId = law_base.id where law_base.flag = 1'
        + (params.name ? ` AND law_base.name like '%${params.name}%'` : '')
        + (params.departmentId ? ` AND law_department.departmentId=${params.departmentId}` : '')
        + (params.keyWordId ? ` AND law_key_word.keyWordId=${params.keyWordId}` : '')
        + (params.startTime ? ` AND law_base.time >= '${params.startTime}'` : '')
        + (params.endTime ? ` AND law_base.time <= '${params.endTime}'` : '');
    console.log(sql);
    connection.query(sql,params,(error, result) => {
        let list = [];
        (result || []).forEach(e => {
            list.push({
                name: e.name,
                id: e.id,
                // content: e.content
            });
        })
        let response = {status:200,data:list};
        res.send(response);
    })
    db.close(connection);
});

/* GET law detail. */
router.get('/getLawDetail', function(req, res, next) {
    var law = new Law();
    var params = URL.parse(req.url, true).query;
    let connection = db.connection();
    // let sql = "select * from law_base where name like '%"+params.name+"%'";
    let sql1 = `select * from law_base where id=${params.id};
    SELECT * from  law_key_word , key_word where law_key_word.keyWordId = key_word.id and law_key_word.lawId=${params.id};
    select * from law_base,law_law where law_base.id = law_law.sonLawId and law_law.dadLawId=${params.id};
    SELECT * from  law_department , department where law_department.departmentId = department.id and law_department.lawId=${params.id};`;
    connection.query(sql1,(error, result) => {
        let list = {};
        list = result[0][0];
        list.keyWordList = [];
        list.aboutLawList = [];
        list.departmentList = [];
        (result[1] || []).forEach(e => {
            list.keyWordList.push({
                name: e.name,
                keyWordId: e.id,
            });
        });
        (result[2] || []).forEach(e => {
            list.aboutLawList.push({
                name: e.name,
                lawId: e.id,
            });
        });
        (result[3] || []).forEach(e => {
            list.departmentList.push({
                name: e.name,
                departmentId: e.id,
            });
        });
        let response = {status:200,data:list};
        res.send(response);
    });
    db.close(connection);
});

/* GET LawList By DepartmentId. */
router.get('/getLawListByDepartmentId', function(req, res, next) {
    var params = URL.parse(req.url, true).query;
    let connection = db.connection();
    // let sql = "select * from law_base where name like '%"+params.name+"%'";
    let sql1 = `select * from law_department,law_base where law_department.lawId = law_base.id and law_department.departmentId=${params.departmentId}`;
    connection.query(sql1,(error, result) => {
        let list = [];
        list = result;
        let response = {status:200,data:list};
        res.send(response);
    });
    db.close(connection);
});

/* GET LawList By LawId. */
router.get('/getLawListByLawId', function(req, res, next) {
    var params = URL.parse(req.url, true).query;
    let connection = db.connection();
    // let sql = "select * from law_base where name like '%"+params.name+"%'";
    let sql1 = `SELECT * FROM law_law,law_base WHERE law_law.sonLawId = law_base.id AND law_law.dadLawId=${params.lawId}`;
    connection.query(sql1,(error, result) => {
        let list = [];
        list = result;
        let response = {status:200,data:list};
        res.send(response);
    });
    db.close(connection);
});

/* GET LawList By KeyWordId. */
router.get('/getLawListByKeyWordId', function(req, res, next) {
    var params = URL.parse(req.url, true).query;
    let connection = db.connection();
    // let sql = "select * from law_base where name like '%"+params.name+"%'";
    let sql1 = `SELECT * FROM law_key_word,law_base WHERE law_key_word.lawId = law_base.id AND law_key_word.keyWordId=${params.keyWordId}`;
    connection.query(sql1,(error, result) => {
        let list = [];
        list = result;
        let response = {status:200,data:list};
        res.send(response);
    });
    db.close(connection);
});

/* GET DepartmentList*/
router.get('/getDepartmentList', function(req, res, next) {
    let connection = db.connection();
    let sql1 = 'SELECT * FROM department';
    connection.query(sql1,(error, result) => {
        let list = [];
        list = result;
        let response = {status:200,data:list};
        res.send(response);
    });
    db.close(connection);
});

/* GET KeyWordList*/
router.get('/getKeyWordList', function(req, res, next) {
    let connection = db.connection();
    let sql1 = 'SELECT * FROM key_word';
    connection.query(sql1,(error, result) => {
        let list = [];
        list = result;
        let response = {status:200,data:list};
        res.send(response);
    });
    db.close(connection);
});

/* GET all data. */
router.get('/getAllData', function(req, res, next) {
    var params = URL.parse(req.url, true).query;
    let connection = db.connection();
    let lawNodes = [];
    let departmentNodes = [];
    let law2department = [];
    let keyWordNodes = [];
    let law2keyWord = [];
    let lawIds = [];
    function getlawNodes() {
        return new Promise((resolve, reject) => {
            let sql = "select distinct id,name,content, DATE_FORMAT(TIME, '%Y-%m-%d %H:%i:%s') AS time,legislative_subject,scope,level from law_base INNER JOIN law_department on law_department.lawId = law_base.id INNER JOIN law_key_word ON law_key_word.lawId = law_base.id INNER JOIN law_limit_department ON law_limit_department.law_id = law_base.id INNER JOIN law_limit_progress ON law_limit_progress.law_id = law_base.id INNER JOIN law_limit_subject ON law_limit_subject.law_id = law_base.id where law_base.flag = 1"
                + (params.departmentId ? ` AND law_department.departmentId=${params.departmentId}` : '')
                + (params.keyWordId ? ` AND law_key_word.keyWordId=${params.keyWordId}` : '')
                + (params.limit1 ? ` AND law_limit_department.limit_department_id in (${params.limit1})` : '')
                + (params.limit2 ? ` AND law_limit_progress.limit_progress_id in (${params.limit2})` : '')
                + (params.limit3 ? ` AND law_limit_subject.limit_subject_id in (${params.limit3})` : '')
                + (params.level ? ` AND law_base.level='${params.level}'` : '')
                + (params.scope ? ` AND law_base.scope='${params.scope}'` : '')
                + (params.startTime ? ` AND law_base.time >= '${params.startTime}'` : '')
                + (params.endTime ? ` AND law_base.time <= '${params.endTime}'` : '');
            console.log(sql);
            connection.query(sql,params,(error, result) => {
                if (error) {
                    console.log(err);
                } else {
                    (result || []).forEach(e => {
                        lawNodes.push({
                            name: e.name,
                            id: e.id,
                            time: e.time ? e.time.toString() : 'No Time',
                            content: e.content,
                            legislative_subject: e.legislative_subject,
                            scope: e.scope,
                            level: e.level,
                            category: 0,
                            label: {
                                normal: {
                                    show: true,
                                }
                            }
                        });
                        lawIds.push(e.id);
                    })
                    resolve(lawIds);
                }
            })
        })
    }
    function getDepartmentList() {
        return new Promise((resolve, reject) => {
            let sql = `select * from law_department left join department on law_department.departmentId = department.id where lawId in (${lawIds.toString()})`;
            console.log(sql);
            connection.query(sql,params,(error, result) => {
                (result || []).forEach(e => {
                    let flag = true;
                    departmentNodes.some(item => {
                        if (item.id == e.id) {
                            flag = false;
                            return true;
                        }
                    })
                    if (flag) {
                        departmentNodes.push({
                            name: e.name,
                            id: e.id,
                            category: 1,
                            label: {
                                normal: {
                                    show: false,
                                }
                            }
                        })
                    }
                    law2department.push({
                        source: e.lawId ? e.lawId.toString() : '',
                        target: e.departmentId ? e.departmentId.toString() : '',
                    })
                })
                resolve();
            })
        })
    }
    function getkeyWordList() {
        return new Promise((resolve, reject) => {
            let sql = `select * from law_key_word left join key_word on law_key_word.keyWordId = key_word.id where lawId in (${lawIds.toString()})`;
            console.log(sql);
            connection.query(sql,params,(error, result) => {
                (result || []).forEach(e => {
                    let flag = true;
                    keyWordNodes.some(item => {
                        if (item.id == e.id) {
                            flag = false;
                            return true;
                        }
                    })
                    if (flag) {
                        keyWordNodes.push({
                            name: e.name,
                            id: e.id,
                            category: 2,
                            label: {
                                normal: {
                                    show: false,
                                }
                            }
                        })
                    }
                    law2keyWord.push({
                        source: e.lawId ? e.lawId.toString() : '',
                        target: e.keyWordId ? e.keyWordId.toString() : '',
                    })
                })
                resolve();
            })
        })
    }
    function getDepartmentListAndKeyWordListById(lawId) {
        return new Promise((resolve, reject) => {
            lawNodes.forEach((e, index) => {
                let sql = `select name from law_department left join department on law_department.departmentId = department.id where lawId in (${e.id});
                select name from law_key_word left join key_word on law_key_word.keyWordId = key_word.id where lawId in (${e.id})`;
                connection.query(sql,params,(error, result) => {
                    e.departmentList = [];
                    e.keyWordList = [];
                    (result[0] || []).forEach(item => {
                        e.departmentList.push(item.name)
                    });
                    (result[1] || []).forEach(item => {
                        e.keyWordList.push(item.name)
                    });
                    if (index === lawNodes.length-1) {
                        resolve();
                    }
                })
            })
        })
    }
    getlawNodes().then(result => {
        Promise.all([getDepartmentList(),getkeyWordList()]).then(result => {
            let list = {};
            list.node = lawNodes.concat(departmentNodes).concat(keyWordNodes);
            list.links = law2department.concat(law2keyWord);
            getDepartmentListAndKeyWordListById().then(result => {
                list.lawNodes = lawNodes;
                let response = {status:200,data:list};
                res.send(response);
                db.close(connection);
            })
        })
    })
});

/*查询效力等级下拉框*/
router.get('/getLevel',function(req, res, next) {
    let connection = db.connection();
    let sql = 'select distinct level from law_base where level is not null'
    connection.query(sql,(error, result) => {
        let list = [];
        (result || []).forEach(e => {
            list.push({
                name: e.level,
                id: e.level
            })
        });
        let response = {status:200,data:list};
        res.send(response);
    });
    db.close(connection);
})

/*查询施行范围下拉框 */

router.get('/getScope',function(req, res, next) {
    let connection = db.connection();
    let sql = 'SELECT DISTINCT scope FROM law_base WHERE scope IS NOT NULL'
    connection.query(sql,(error, result) => {
        let list = [];
        (result || []).forEach(e => {
            list.push({
                name: e.scope,
                id: e.scope
            })
        });
        let response = {status:200,data:list};
        res.send(response);
    });
    db.close(connection);
})

/*查询法律数量树状图 */

router.get('/getLawNum',function(req, res, next) {
    let connection = db.connection();
    var params = URL.parse(req.url, true).query;
    let sql = 
    `SELECT SUM(t2.cnt) AS cnt,t2.time AS time FROM (
        SELECT COUNT(*) AS cnt, DATE_FORMAT(TIME, '%Y') AS time 
        FROM (
            SELECT DISTINCT id, time
            FROM law_base LEFT JOIN law_department ON law_base.id = law_department.lawId 
            LEFT JOIN law_key_word ON law_base.id = law_key_word.lawId 
            LEFT JOIN law_limit_department ON law_limit_department.law_id = law_base.id 
            LEFT JOIN law_limit_progress ON law_limit_progress.law_id = law_base.id 
            LEFT JOIN law_limit_subject ON law_limit_subject.law_id = law_base.id 
            WHERE flag = 1
            ${params.departmentId ? 'AND law_department.departmentId='+params.departmentId : ''}
            ${params.keyWordId ? ` AND law_key_word.keyWordId=${params.keyWordId}` : ''}
            ${params.limit1 ? ` AND law_limit_department.limit_department_id in (${params.limit1})` : ''}
            ${params.limit2 ? ` AND law_limit_progress.limit_progress_id in (${params.limit2})` : ''}
            ${params.limit3 ? ` AND law_limit_subject.limit_subject_id in (${params.limit3})` : ''}
            ${params.level ? ` AND law_base.level='${params.level}'` : ''}
            ${params.scope ? ` AND law_base.scope='${params.scope}'` : ''}
            ${params.startTime ? ` AND law_base.time >= '${params.startTime}'` : ''}
            ${params.endTime ? ` AND law_base.time <= '${params.endTime}'` : ''}
        )t1
        GROUP BY time
    )t2 GROUP BY t2.time`
    console.log(sql)
    connection.query(sql,(error, result) => {
        let list = [];
        (result || []).forEach(e => {
            list.push({
                cnt: e.cnt,
                time: e.time ? e.time.toString() : 'No Time'
            })
        });
        let response = {status:200,data:list};
        res.send(response);
    });
    db.close(connection);
})

/* GET law Limit. */
router.get('/getLimit', function(req, res, next) {
    var law = new Law();
    var params = URL.parse(req.url, true).query;
    let connection = db.connection();
    // let sql = "select * from law_base where name like '%"+params.name+"%'";
    let sql1 = `select limit_department_id as id,limit_department_name as name from limit_department;
    select limit_progress_id as id,limit_progress_name as name from limit_progress;
    select limit_subject_id as id,limit_subject_name as name from limit_subject;`;
    connection.query(sql1,(error, result) => {
        let list = [{
            id: 'limit_department',
            name: '规定责任部门',
            children: result[0]
        },{
            id: 'limit_progress',
            name: '规定过程',
            children: result[1]
        },{
            id: 'limit_subject',
            name: '规定对象',
            children: result[2]
        }];
        list.limit_department = [];
        list.limit_progress = [];
        list.limit_subject = [];
        let response = {status:200,data:list};
        res.send(response);
    });
    db.close(connection);
});
module.exports = router;
