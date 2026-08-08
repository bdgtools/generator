console.log("MR DIY SCRIPT BERHASIL LOAD");

/* =====================================================
   MR DIY STORE TOOLS v2.0
   MAIN SCRIPT
===================================================== */


/* =====================================================
   MR DIY STORE TOOLS v2.0
   MAIN SCRIPT
===================================================== */

let hasilGlobal = [];
let itemizeGlobal = [];
let isItemizeChanged = false;

let masterGlobal = {};
let currentFilter = "all";
let currentKeyword = "";

// =====================================================
// SESSION
// =====================================================

const SESSION_DURATION = 60 * 60 * 1000; // 1 jam
let sessionTimer = null;

const GAS_URL =
"https://script.google.com/macros/s/AKfycby-6p9xJjnL_kAF40w9YBjEixvZlrZUNL6DrvA5MDIWbOSTS_kGMCBxtp_tDxw_ffvc/exec";


// =====================================================
// SESSION ACTIVITY
// =====================================================

function resetSessionTimer(){

    const storeCode =
        localStorage.getItem("storeCode");

    if(!storeCode){
        return;
    }

    localStorage.setItem(
        "lastActivity",
        Date.now()
    );

    clearTimeout(sessionTimer);

    sessionTimer =
        setTimeout(
            autoLogout,
            SESSION_DURATION
        );
}


// =====================================================
// CEK SESSION
// =====================================================

function checkSession(){

    const storeCode =
        localStorage.getItem("storeCode");

    if(!storeCode){
        return false;
    }

    const lastActivity =
        Number(
            localStorage.getItem("lastActivity")
        );

    if(!lastActivity){

        resetSessionTimer();

        return true;
    }

    const inactive =
        Date.now() - lastActivity;

    if(inactive >= SESSION_DURATION){

        autoLogout();

        return false;
    }

    clearTimeout(sessionTimer);

    sessionTimer =
        setTimeout(
            autoLogout,
            SESSION_DURATION - inactive
        );

    return true;
}


// =====================================================
// AUTO LOGOUT
// =====================================================

function autoLogout(){

    clearTimeout(sessionTimer);

    localStorage.removeItem("storeCode");
    localStorage.removeItem("storeName");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("lastActivity");

    hasilGlobal = [];
    itemizeGlobal = [];

    isItemizeChanged = false;

    const btnSave =
        document.getElementById("btnSave");

    if(btnSave){
        btnSave.disabled = true;
    }

    document
        .querySelectorAll(".modulePage")
        .forEach(el=>{
            el.style.display = "none";
        });

    const dashboard =
        document.getElementById("dashboardPage");

    if(dashboard){
        dashboard.style.display = "none";
    }

    const loginPage =
        document.getElementById("loginPage");

    if(loginPage){
        loginPage.style.display = "block";
    }

    const storeCodeInput =
        document.getElementById("storeCode");

    const passwordInput =
        document.getElementById("password");

    if(storeCodeInput){
        storeCodeInput.value = "";
    }

    if(passwordInput){
        passwordInput.value = "";
    }

    updateSaveStatus(false);

    showPopup(
        "Session habis, silakan login kembali.",
        "⏱"
    );
}


// =====================================================
// DETEKSI AKTIVITAS USER
// =====================================================

[
    "click",
    "mousemove",
    "keydown",
    "scroll",
    "touchstart"
].forEach(eventName=>{

    document.addEventListener(
        eventName,
        ()=>{
            if(
                localStorage.getItem("storeCode")
            ){
                resetSessionTimer();
            }
        },
        {passive:true}
    );

});


// =====================================================
// STORE INFO
// =====================================================

function updateStoreInfo(storeCode,storeName){

    document
    .querySelectorAll(".storeInfo")
    .forEach(el=>{

        el.innerHTML =
        `${storeCode} - ${storeName || ""}`;

    });

}


// =====================================================
// LOGIN
// =====================================================

function login(){

    console.log("FUNCTION LOGIN JALAN");

    const storeCode =
        document
        .getElementById("storeCode")
        .value
        .trim();

    const password =
        document
        .getElementById("password")
        .value
        .trim();

    const msg =
        document.getElementById("loginMsg");

    // =============================================
    // VALIDASI
    // =============================================

    if(!storeCode || !password){

        msg.innerHTML =
            "Store Code dan Password wajib diisi";

        showPopup(
            "Store Code dan Password wajib diisi",
            "⚠"
        );

        return;
    }

    msg.innerHTML = "";

    // =============================================
    // LOADING
    // =============================================

    showLoading("Login...");

    // =============================================
    // URL
    // =============================================

    const url =
        GAS_URL +
        "?action=login" +
        "&storeCode=" +
        encodeURIComponent(storeCode) +
        "&password=" +
        encodeURIComponent(password);

    console.log("LOGIN URL:", url);

    // =============================================
    // FETCH
    // =============================================

    fetch(url)

    .then(res => {

        console.log(
            "LOGIN STATUS:",
            res.status
        );

        if(!res.ok){

            throw new Error(
                "Server error: " +
                res.status
            );

        }

        return res.text();

    })

    .then(text => {

        console.log(
            "LOGIN RAW:",
            text
        );

        let data;

        try{

            data =
                JSON.parse(text);

        }

        catch(err){

            console.error(
                "JSON ERROR:",
                err
            );

            throw new Error(
                "Response server tidak valid"
            );

        }

        hideLoading();

        // =========================================
        // LOGIN BERHASIL
        // =========================================

        if(data.success){

            console.log(
                "LOGIN BERHASIL:",
                data
            );

            localStorage.setItem(
                "storeCode",
                data.storeCode || storeCode
            );

            localStorage.setItem(
                "storeName",
                data.storeName || ""
            );

            localStorage.setItem(
                "loginTime",
                Date.now()
            );

            localStorage.setItem(
                "lastActivity",
                Date.now()
            );

            updateStoreInfo(
                data.storeCode || storeCode,
                data.storeName || ""
            );

            document
                .getElementById("loginPage")
                .style.display = "none";

            document
                .getElementById("dashboardPage")
                .style.display = "block";

            resetSessionTimer();

            showPopup(
                "Login berhasil",
                "✔"
            );

            // =====================================
            // LOAD ITEMIZE
            // =====================================

            loadItemize();

        }

        // =========================================
        // LOGIN GAGAL
        // =========================================

        else{

            console.warn(
                "LOGIN DITOLAK:",
                data.message
            );

            msg.innerHTML =
                data.message ||
                "Login gagal";

            showPopup(
                data.message ||
                "Login gagal",
                "❌"
            );

        }

    })

    .catch(err => {

        hideLoading();

        console.error(
            "LOGIN ERROR:",
            err
        );

        msg.innerHTML =
            err.message ||
            "Gagal koneksi ke server";

        showPopup(
            "Gagal koneksi ke server",
            "❌"
        );

    });

}


// =====================================================
// AUTO LOGIN SAAT PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    ()=>{

        const storeCode =
            localStorage.getItem("storeCode");

        if(storeCode){

            if(!checkSession()){
                return;
            }

            const storeName =
                localStorage.getItem("storeName");

            updateStoreInfo(
                storeCode,
                storeName
            );

            document
                .getElementById("loginPage")
                .style.display = "none";

            document
                .getElementById("dashboardPage")
                .style.display = "block";

            loadItemize();

        }

        const btn =
            document.getElementById("loginBtn");

        if(btn){

            btn.addEventListener(
                "click",
                login
            );

        }

    }
);


// =====================================================
// LOGOUT MANUAL
// =====================================================

function logout(){

    clearTimeout(sessionTimer);

    localStorage.removeItem("storeCode");
    localStorage.removeItem("storeName");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("lastActivity");

    hasilGlobal = [];
    itemizeGlobal = [];

    isItemizeChanged = false;

    document
        .querySelectorAll(".modulePage")
        .forEach(el=>{
            el.style.display = "none";
        });

    document
        .getElementById("dashboardPage")
        .style.display = "none";

    document
        .getElementById("loginPage")
        .style.display = "block";

    document
        .getElementById("storeCode")
        .value = "";

    document
        .getElementById("password")
        .value = "";

    updateSaveStatus(false);

    const btnSave =
        document.getElementById("btnSave");

    if(btnSave){
        btnSave.disabled = true;
    }

    showPopup(
        "Logout berhasil",
        "✔"
    );

}





/* =====================================================
   MODULE CONTROL
===================================================== */

function openModule(module){

    document.getElementById("dashboardPage").style.display="none";

    document.querySelectorAll(".modulePage")
    .forEach(el=>el.style.display="none");

    const target=document.getElementById(module+"Module");

    if(target){
        target.style.display="block";
    }

    // Tampilkan hanya jika modul Itemize
    const counter=document.getElementById("itemizeCounter");

    if(counter){
        counter.style.display =
            module==="itemize"
            ? "block"
            : "none";
    }

}

function backDashboard(){

    document
    .querySelectorAll(".modulePage")
    .forEach(el=>{
        el.style.display="none";
    });

    document
    .getElementById("dashboardPage")
    .style.display="block";

    // Sembunyikan counter Itemize
    const counter = document.getElementById("itemizeCounter");
    if(counter){
        counter.style.display = "none";
    }

}
/* =====================================================
   STOCK BALANCE MODULE
===================================================== */



function generateData(){
   showLoading("Generate Stock...");


    const sistemFile =
    document
    .getElementById("sistemFile")
    .files[0];



    const fisikFiles =
    document
    .getElementById("fisikFile")
    .files;





    if(!sistemFile || fisikFiles.length===0){

    hideLoading();

    showPopup(
    "Upload Export Shelf dan Scan Fisik terlebih dahulu",
    "⚠"
    );

    return;

}






    let proses=[];



    proses.push(
        readTXT(sistemFile)
    );





    for(let i=0;i<fisikFiles.length;i++){


        proses.push(
            readTXT(fisikFiles[i])
        );


    }





    Promise.all(proses)
       .then(files=>{

    hideLoading();



        const sistem =
        parseSistem(files[0]);



        let fisik={};





        for(let i=1;i<files.length;i++){


            let scan =
            parseFisik(files[i]);



            Object.keys(scan)
            .forEach(sku=>{


                if(!fisik[sku]){


                    fisik[sku]=0;


                }



                fisik[sku]+=scan[sku];



            });



        }






hasilGlobal =
prosesStock(
    fisik,
    sistem
);





        tampilkanSummary(
    hasilGlobal
);


tampilkanHasil(
    hasilGlobal
);




    })

    .catch(err=>{
       hideLoading();


        console.error(err);


        showPopup("Gagal membaca file","❌");


    });



}



function readTXT(file){



    return new Promise(
    (resolve,reject)=>{



        let reader =
        new FileReader();




        reader.onload =
        e=>{


            resolve(
                e.target.result
            );


        };




        reader.onerror =
        reject;



        reader.readAsText(file);



    });



}









function parseFisik(text){



    let data={};



    let rows =
    text.split(/\r?\n/);





    rows.forEach(row=>{



        let col =
        row.split(",");




        if(col.length>=3){



            let sku =
            col[1]
            .trim();



            let qty =
            Number(
            col[2]
            ) || 0;





            if(sku){



                if(!data[sku]){


                    data[sku]=0;


                }



                data[sku]+=qty;



            }


        }



    });




    return data;



}









function parseSistem(text){



    let data={};



    let rows =
    text.split(/\r?\n/);





    rows.forEach(row=>{



        let col =
        row.split(",");





        if(col.length>=9){



            let sku =
            col[0]
            .trim();




            if(sku){



                data[sku]={



                    rack:
                    col[1]
                    .trim(),



                    price:
                    col[2]
                    .trim(),



                    system:
                    Number(col[3])
                    ||0,



                    desc:
                    col[8]
                    .trim()



                };



            }




        }




    });




    return data;



}









function prosesStock(fisik,sistem){



    let hasil=[];





    Object.keys(fisik)

    .forEach(sku=>{



        let row={};



        if(sistem[sku]){



            let sys =
            sistem[sku]
            .system;



            let fis =
            fisik[sku];



            let sel =
            sys-fis;





            let status =
            "Tally";



            if(sel<0){

                status="Short";

            }

            else if(sel>0){

                status="Extra";

            }







            row={


                sku:sku,

                rack:
                sistem[sku].rack,

                desc:
                sistem[sku].desc,

                system:sys,

                fisik:fis,

                selisih:sel,

                status:status


            };



        }

        else{



            row={


                sku:sku,

                rack:"-",


                desc:
                "SKU Tidak Ada Di Export Shelf",


                system:0,


                fisik:fisik[sku],


                selisih:
                -fisik[sku],


                status:
                "Not In System"



            };


        }






        hasil.push(row);




    });








    hasil.sort(
    (a,b)=>{



        if(a.rack==="-")


        return 1;




        if(b.rack==="-")


        return -1;





        return a.rack.localeCompare(
            b.rack,
            undefined,
            {
                numeric:true
            }
        );



    });



    return hasil;



}
/* =====================================================
   STOCK RESULT DISPLAY
===================================================== */


function tampilkanSummary(data){


    let total =
    data.length;


    let tally=0;
    let short=0;
    let extra=0;



    data.forEach(row=>{


        if(row.status==="Tally"){

            tally++;

        }


        if(row.status==="Short"){

            short++;

        }


        if(row.status==="Extra"){

            extra++;

        }



    });


    let html=`


    <div class="summary">


        <div class="card total">

            <h3>${total}</h3>

            <p>Total SKU</p>

        </div>




        <div class="card tally">

            <h3>${tally}</h3>

            <p>Tally</p>

        </div>





        <div class="card short">

            <h3>${short}</h3>

            <p>Short</p>

        </div>





        <div class="card extra">

            <h3>${extra}</h3>

            <p>Extra</p>

        </div>



    </div>



    `;



    document
    .getElementById("summary")
    .innerHTML=html;



}









function tampilkanHasil(data){


    let html=`


    <table>


    <thead>

    <tr>

        <th>SKU</th>

        <th>Rack</th>

        <th>Description</th>

        <th>System</th>

        <th>Fisik</th>

        <th>Selisih</th>

        <th>Status</th>


    </tr>


    </thead>



    <tbody>


    `;






    data.forEach(row=>{



        let cls="sama";



        if(row.status==="Short"){


            cls="minus";


        }


        else if(row.status==="Extra"){


            cls="plus";


        }


        else if(row.status==="Not In System"){


            cls="notSystem";


        }





        html+=`


        <tr class="${cls}">


            <td>${row.sku}</td>


            <td>${row.rack}</td>


            <td>${row.desc}</td>


            <td>${row.system}</td>


            <td>${row.fisik}</td>


            <td>${row.selisih}</td>


            <td>${row.status}</td>



        </tr>


        `;



    });





    html+=`


    </tbody>


    </table>


    `;




    document
    .getElementById("hasil")
    .innerHTML=html;



}

/* =====================================================
   SEARCH & FILTER
===================================================== */


function filterTabel(){



    const keyword =

    document
    .getElementById("search")
    .value
    .toLowerCase();




    const filter =

    document
    .getElementById("filter")
    .value;

   let data =
      hasilGlobal.filter(row=>{

        let cocokSearch =



        row.sku
        .toLowerCase()
        .includes(keyword)



        ||



        row.desc
        .toLowerCase()
        .includes(keyword);







        let cocokFilter=true;





        if(filter==="plus"){


            cocokFilter =
            row.status==="Extra";


        }



        if(filter==="minus"){


            cocokFilter =
            row.status==="Short";


        }



        if(filter==="sama"){


            cocokFilter =
            row.status==="Tally";


        }





        return cocokSearch && cocokFilter;



    });






    tampilkanHasil(data);



}









/* =====================================================
   DOWNLOAD EXCEL STOCK
===================================================== */


function downloadExcel(){

    if(hasilGlobal.length===0){

        showPopup(
            "Belum ada data hasil",
            "⚠"
        );

        return;

    }


    showLoading("Creating Excel...");


    let exportData = hasilGlobal.map(row=>({

        SKU: row.sku,

        Rack_Number: row.rack,

        Description: row.desc,

        Qty_System: row.system,

        Qty_Fisik: row.fisik,

        Selisih: row.selisih,

        Status: row.status

    }));


    let ws =
    XLSX.utils.json_to_sheet(exportData);


    ws["!cols"]=[

        {wch:15},
        {wch:15},
        {wch:40},
        {wch:12},
        {wch:12},
        {wch:12},
        {wch:15}

    ];


    let wb =
    XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Stock Balance"
    );


    let date=new Date();


    let filename =
    "StockBalance_" +
    date.getFullYear()+"-"+

    String(date.getMonth()+1)
    .padStart(2,"0")+"-"+

    String(date.getDate())
    .padStart(2,"0")+

    ".xlsx";


    XLSX.writeFile(
        wb,
        filename
    );


    hideLoading();

}
/* =====================================================
   ITEMIZE MODULE
===================================================== */



function generateItemize(){

    console.log("=== GENERATE ITEMIZE ===");

    showLoading("Generate Itemize...");

    const masterFile =
        document.getElementById("itemizeMasterFile").files[0];

    let scanFiles = Array.from(
        document.getElementById("itemizeScanFile").files
    );

    // Validasi Master
    if(!masterFile){

        hideLoading();

        showPopup(
            "Upload Master TXT terlebih dahulu",
            "⚠"
        );

        return;
    }

    // Hilangkan master jika ikut terpilih sebagai scan
   scanFiles =
    scanFiles.filter(
        file=>file!==masterFile
    );

    // Validasi Scan
    if(scanFiles.length===0){

        hideLoading();

        showPopup(
            "File Scan TXT tidak ditemukan",
            "⚠"
        );

        return;
    }

    // Siapkan Promise baca file
    const files = [readTXT(masterFile)];

    scanFiles.forEach(file=>{
        files.push(readTXT(file));
    });

    Promise.all(files)

    .then(data=>{

        console.log("SEMUA FILE BERHASIL DIBACA");

        const master =
            parseItemizeMaster(data[0]);

        console.log(
            "MASTER SKU :",
            Object.keys(master).length
        );

        let scan = {};

        // Gabungkan semua file scan
        for(let i=1;i<data.length;i++){

            const result =
                parseItemizeScan(data[i]);

            if(Object.keys(result).length===0){
                continue;
            }

            Object.keys(result).forEach(sku=>{

                if(!scan[sku]){
                    scan[sku]=[];
                }

                result[sku].forEach(rack=>{

                    if(!scan[sku].includes(rack)){
                        scan[sku].push(rack);
                    }

                });

            });

        }

        console.log(
            "SCAN SKU :",
            Object.keys(scan).length
        );
       
       const hasilBaru = prosesItemize(master, scan);
       
       itemizeGlobal = mergeItemize(itemizeGlobal, hasilBaru);
       
       isItemizeChanged = true;
       
       updateSaveStatus(true);
       
       const btnSave =
document.getElementById("btnSave");

if(btnSave){
    btnSave.disabled=false;
}

        tampilkanItemizeSummary(itemizeGlobal);

        tampilkanItemizeResult(itemizeGlobal);

        hideLoading();

        console.log("GENERATE ITEMIZE SELESAI");

    })

    .catch(err=>{

        hideLoading();

        console.error("ERROR GENERATE :", err);

        showPopup(
            "Gagal proses Itemize",
            "❌"
        );

    });

}



function parseItemizeMaster(text){


    let master={};


    let rows =
    text.split(/\r?\n/);



    rows.forEach(row=>{


        let col =
        row.split(",");



        if(col.length>=9){


            let sku =
            col[0].trim();



            let qtySystem =
            Number(col[3]) || 0;



            // skip qty system 0
            if(
                !sku ||
                qtySystem<=0
            ){
                return;
            }



            master[sku]={


                sku:sku,


                rack:
                col[1].trim(),


                system:
                qtySystem,


                desc:
                col[8].trim()


            };


        }


    });



    return master;


}
function loadMasterFile(){

    const masterFile =
        document.getElementById("itemizeMasterFile").files[0];

    if(!masterFile){

        showPopup("Upload Master TXT terlebih dahulu","⚠");

        return Promise.reject();

    }

    return readTXT(masterFile)

        .then(text=>{

            masterGlobal =
                parseItemizeMaster(text);

            console.log(
                "MASTER LOADED :",
                Object.keys(masterGlobal).length,
                "SKU"
            );

        });

}

function parseItemizeScan(text){



    let scan={};



    let rows =
    text.split(/\r?\n/);





    rows.forEach(row=>{



        let col =
        row.split(",");





        if(
           col.length>=3 &&
           col[1].includes("-")
        ){


            let rack =
            col[1]
            .trim();



            let sku =
            col[2]
            .trim();





            if(!sku)
            return;





            if(!scan[sku]){


                scan[sku]=[];


            }




            if(
            !scan[sku]
            .includes(rack)
            ){


                scan[sku]
                .push(rack);


            }




        }



    });





    return scan;


}


function prosesItemize(master,scan){



    let hasil=[];






    Object.keys(master)

    .forEach(sku=>{



        let item =
        master[sku];



        let rackArea="-";

        let display="-";

        let remark="Unscan";






        if(scan[sku]){



            remark="Scanned";



            rackArea =
            scan[sku]
            .join(", ");







            if(scan[sku].length>1){



                display =
                "Double Display";



            }

            else{


                if(
                scan[sku][0]
                ===
                item.rack
                ){


                    display =
                    "Single Display";


                }

                else{


                    display =
                    "Wrong Area";


                }


            }





        }







        hasil.push({
           
           sku: item.sku,

           rack: item.rack,
   
           system: item.system,
   
           desc: item.desc,
   
           rackArea: rackArea,
   
           display: display,
   
           remark: remark
        });



    });






    return hasil;



}

function mergeItemize(oldData,newData){

    const database={};


    // simpan data lama dulu
    oldData.forEach(item=>{

        database[item.sku]={
            ...item
        };

    });


    // update dengan master terbaru
    newData.forEach(item=>{

        database[item.sku]={
            ...database[item.sku],
            ...item
        };

    });

    // Data hasil generate terbaru menjadi dasar
    newData.forEach(item=>{

        database[item.sku]={...item};

    });

    // Pertahankan rackArea hasil scan lama
    oldData.forEach(old=>{

        if(
            old.remark!=="Scanned" ||
            !database[old.sku]
        ){
            return;
        }

        const rackSet=new Set();

        if(old.rackArea && old.rackArea!=="-"){
            old.rackArea
                .split(",")
                .forEach(r=>rackSet.add(r.trim()));
        }

        if(
            database[old.sku].rackArea &&
            database[old.sku].rackArea!=="-"
        ){
            database[old.sku]
                .rackArea
                .split(",")
                .forEach(r=>rackSet.add(r.trim()));
        }

        database[old.sku].rackArea =
            rackSet.size
            ? [...rackSet].join(", ")
            : "-";

        if(rackSet.size){

            database[old.sku].remark="Scanned";

            if(rackSet.size>1){

                database[old.sku].display="Double Display";

            }else{

                const area=[...rackSet][0];

                database[old.sku].display =
                    area===database[old.sku].rack
                    ? "Single Display"
                    : "Wrong Area";
            }

        }

    });

    return Object.values(database)
        .sort((a,b)=>
            a.rack.localeCompare(
                b.rack,
                undefined,
                {numeric:true}
            )
        );

}
function tampilkanItemizeSummary(data){

let total=data.length;

let scanned=0;
let unscan=0;
let doubleDisplay=0;
let wrongArea=0;


data.forEach(row=>{

    if(row.remark==="Scanned")
        scanned++;


    if(row.remark==="Unscan")
        unscan++;


    if(row.display==="Double Display")
        doubleDisplay++;


    if(row.display==="Wrong Area")
        wrongArea++;

});


const percentage =
total
?
((scanned/total)*100).toFixed(2)
:
0;



let html = `

<div class="summary">


    <div class="card total"
         data-filter="all"
         onclick="filterItemize('all')">

        <h3>${total}</h3>

        <p>Total SKU</p>

    </div>



    <div class="card tally"
         data-filter="scanned"
         onclick="filterItemize('scanned')">

        <h3>${scanned}</h3>

        <p>Scanned</p>

    </div>




    <div class="card short"
         data-filter="unscan"
         onclick="filterItemize('unscan')">

        <h3>${unscan}</h3>

        <p>Unscan</p>

    </div>





    <div class="card extra"
         data-filter="wrong"
         onclick="filterItemize('wrong')">

        <h3>${wrongArea}</h3>

        <p>Wrong Area</p>

    </div>





    <div class="card"
         data-filter="double"
         onclick="filterItemize('double')">

        <h3>${doubleDisplay}</h3>

        <p>Double Display</p>

    </div>



    <div class="card">

        <h3>${percentage}%</h3>

        <p>Progress</p>

    </div>


</div>

`;



document
.getElementById("itemizeSummary")
.innerHTML = html;


}

/* =====================================================
   ITEMIZE RESULT TABLE
===================================================== */

function filterItemize(type){

    currentFilter = type;

    applyItemizeFilter();

    updateFilterCard();

}


function searchItemize(keyword){

    currentKeyword =
    keyword.toLowerCase();

    applyItemizeFilter();

}


function applyItemizeFilter(){

    let data=[...itemizeGlobal];


    if(currentFilter==="all"){

        data=[...itemizeGlobal];

    }


    if(currentFilter==="scanned"){

        data=data.filter(
        x=>x.remark==="Scanned"
        );

    }

    if(currentFilter==="unscan"){

        data=data.filter(
        x=>x.remark==="Unscan"
        );

    }


    if(currentFilter==="double"){

        data=data.filter(
        x=>x.display==="Double Display"
        );

    }


    if(currentFilter==="wrong"){

        data=data.filter(
        x=>x.display==="Wrong Area"
        );

    }



    if(currentKeyword){

        data=data.filter(row=>

        row.sku
        .toLowerCase()
        .includes(currentKeyword)

        ||

        (row.desc || "")
.toLowerCase()
.includes(currentKeyword)

        ||

       (row.rack || "")
.toLowerCase()
        .includes(currentKeyword)

        );

    }



    updateCounter(data.length);

    tampilkanItemizeResult(data);

}



function tampilkanItemizeResult(data){

    let html = `


<table>


<thead>

<tr>

<th>SKU</th>

<th>Rack Number</th>

<th>Qty System</th>

<th>Description</th>

<th>Rack Area</th>

<th>Display</th>

<th>Remark</th>


</tr>

</thead>


<tbody>


`;




data.forEach(row=>{



    let cls="sama";



    if(row.remark==="Unscan"){


        cls="minus";


    }


    else if(row.display==="Double Display"){


        cls="plus";


    }


    else if(row.display==="Wrong Area"){


        cls="wrongArea";


    }






html += `

<tr class="${cls}">

<td class="copySku"
onclick="copyText('${row.sku}')">
${row.sku}
</td>

<td class="copyRack"
onclick="copyText('${row.rack}')">
${row.rack}
</td>

<td>${row.system}</td>

<td>${row.desc}</td>

<td class="copyRack"
onclick="copyText('${row.rackArea}')">
${row.rackArea}
</td>

<td>${row.display}</td>

<td>${row.remark}</td>

</tr>

`;

});




html+=`


</tbody>


</table>


`;





document
.getElementById("itemizeResult")
.innerHTML=html;



}

function updateFilterCard(){

    document
    .querySelectorAll(".summary .card")
    .forEach(card=>card.classList.remove("active"));

    const card =
    document.querySelector(`[data-filter="${currentFilter}"]`);

    if(card){

        card.classList.add("active");

    }

}

function updateCounter(total){

    document
    .getElementById("itemizeCounter")
    .innerHTML=

    `Showing <b>${total}</b> of <b>${itemizeGlobal.length}</b> SKU`;

}

function copyText(text){

    if(!text || text === "-") return;

    navigator.clipboard.writeText(text)
    .then(()=>{
        showPopup("Copied: " + text,"📋");
    })
    .catch(()=>{
        showPopup("Gagal copy","❌");
    });

}


/* =====================================================
   DOWNLOAD ITEMIZE EXCEL
===================================================== */



function downloadItemizeExcel(){



    if(itemizeGlobal.length===0){
       
       showPopup("Belum ada data Itemize","⚠");


        return;


    }






let exportData =

itemizeGlobal.map(row=>({

    SKU:row.sku,

    Rack_Number:row.rack,

    Qty_System:row.system,

    Description:row.desc,

    Rack_Area:row.rackArea,

    Display:row.display,

    Remark:row.remark

}));

let ws =

XLSX.utils
.json_to_sheet(exportData);






ws["!cols"]=[

{wch:15},
{wch:15},
{wch:12},
{wch:40},
{wch:25},
{wch:20},
{wch:15}

];

let wb =

XLSX.utils
.book_new();






XLSX.utils
.book_append_sheet(

wb,

ws,

"Itemize"


);







let now=new Date();





let filename =

"Itemize_"+

now.getFullYear()+"-"+

String(now.getMonth()+1)
.padStart(2,"0")+"-"+

String(now.getDate())
.padStart(2,"0")+

".xlsx";







XLSX.writeFile(

wb,

filename

);



}


/* =====================================================
   SAVE ITEMIZE TO GOOGLE SHEET
===================================================== */

function saveItemize(){

const storeCode =
localStorage.getItem("storeCode");


const data = itemizeGlobal;


const btnSave =
document.getElementById("btnSave");


if(!storeCode){

showPopup(
"Session login hilang",
"❌"
);

return;

}


if(btnSave){
    btnSave.disabled = true;
}


showLoading("Saving...");


fetch(GAS_URL,{
    method:"POST",

    headers:{
        "Content-Type":"text/plain;charset=utf-8"
    },

    body:JSON.stringify({

        action:"saveItemizeBatch",

        storeCode:storeCode,

        data:data

    })

})


.then(res=>res.text())


.then(text=>{

hideLoading();


console.log("SERVER:",text);


const result =
JSON.parse(text);


if(result.success){

    isItemizeChanged=false;


    if(btnSave){
        btnSave.disabled=true;
    }


    updateSaveStatus(false);

}


showPopup(
result.message,
"✔"
);


})


.catch(err=>{


hideLoading();


console.error(err);


if(btnSave){
    btnSave.disabled=false;
}


showPopup(
"Gagal koneksi ke server",
"❌"
);


});


}

/* =====================================================
   LOAD ITEMIZE AFTER LOGIN
===================================================== */
function loadItemize(){

    const storeCode = localStorage.getItem("storeCode");

    if(!storeCode) return;

    fetch(
        GAS_URL +
        "?action=loadItemize&storeCode=" +
        encodeURIComponent(storeCode)
    )
    .then(res=>res.json())
    .then(result=>{

        console.log("LOAD DARI SHEET", result.data);

        if(result.success){
           
           itemizeGlobal = (result.data || []).map(item=>{

    const rackArea =
        item.rackArea &&
        String(item.rackArea).trim() !== ""
            ? String(item.rackArea)
            : "-";
    let display = item.display || "-";
    let remark = item.remark || "Unscan";

    // Hitung ulang supaya selalu konsisten
    if(rackArea === "-"){

        display = "-";
        remark = "Unscan";

    }else{

        const rackList = rackArea
            .split(",")
            .map(r=>r.trim())
            .filter(r=>r);

        remark = "Scanned";

        if(rackList.length > 1){

            display = "Double Display";

        }else{

            display =
                rackList[0] === item.rack
                ? "Single Display"
                : "Wrong Area";

        }

    }

    return{

        ...item,

        rackArea,

        display,

        remark

    };

});

tampilkanItemizeSummary(itemizeGlobal);
tampilkanItemizeResult(itemizeGlobal);
           
           updateSaveStatus(false);
           
           const btnSave =
document.getElementById("btnSave");

if(btnSave){
    btnSave.disabled=true;
}
        }else{

            console.log(result.message);

        }

    })
    .catch(err=>{

        console.error(err);

    });

}


/* =====================================================
   DELETE ITEMIZE DATABASE
===================================================== */



async function deleteItemizeData(){

    const ok = await showConfirm(
        "Yakin ingin menghapus semua data Itemize?"
    );

    if(!ok) return;


    const storeCode =
    localStorage.getItem("storeCode");

   showLoading("Deleting...");
   
    fetch(GAS_URL,{

        method:"POST",

        headers:{
            "Content-Type":"text/plain;charset=utf-8"
        },


        body:JSON.stringify({

            action:"deleteItemize",

            storeCode:storeCode

        })


    })

    .then(res=>res.text())

    .then(text=>{
       hideLoading();


        console.log(text);


        const result =
        JSON.parse(text);



        if(result.success){


            itemizeGlobal = [];
           
           isItemizeChanged = false;
           
           updateSaveStatus(false);
           
          const btnSave =
document.getElementById("btnSave");

if(btnSave){
    btnSave.disabled=true;
}
           
           tampilkanItemizeSummary(itemizeGlobal);
           
           tampilkanItemizeResult(itemizeGlobal);
        
        }


        showPopup(result.message,"✔");



    })

    .catch(err=>{
       hideLoading();


        console.error(err);

        showPopup("Delete gagal koneksi","❌");


    });


}
window.addEventListener("beforeunload",function(e){

    if(isItemizeChanged){

        e.preventDefault();

        e.returnValue="";

    }

});

function updateSaveStatus(changed){

    const status =
    document.getElementById("saveStatus");

    if(!status) return;

    if(changed){

    status.innerHTML =
    "🟡 Terdapat perubahan baru, belum disimpan.";

    status.style.background="#fff8e1";
    status.style.color="#e65100";

}
   else{

    status.innerHTML =
    "🟢 Semua perubahan sudah tersimpan.";

    status.style.background="#FFD400";
    status.style.color="#111";
   }

}
let popupTimer;

function showPopup(message,icon="✔"){

    const overlay =
    document.getElementById("popupOverlay");

    document.getElementById("popupIcon").innerHTML=icon;

    document.getElementById("popupText").innerHTML=message;

    overlay.classList.add("show");

    clearTimeout(popupTimer);

popupTimer = setTimeout(()=>{

    overlay.classList.remove("show");

},2000);

}
function showConfirm(message){

    return new Promise(resolve=>{

        const overlay =
        document.getElementById("confirmOverlay");

        document.getElementById("confirmText").innerHTML =
        message;

        overlay.classList.add("show");

        document.getElementById("btnCancelConfirm").onclick=()=>{

            overlay.classList.remove("show");

            resolve(false);

        };

        document.getElementById("btnOkConfirm").onclick=()=>{

            overlay.classList.remove("show");

            resolve(true);

        };

    });

}

function showLoading(text="Loading..."){

    const overlay =
    document.getElementById("loadingOverlay");

    const txt =
    document.getElementById("loadingText");


    if(!overlay || !txt) return;


    txt.innerHTML=text;

    overlay.classList.add("show");

}

function hideLoading(){

    document
        .getElementById("loadingOverlay")
        .classList
        .remove("show");

}

// =====================================================
// SALES CHECK MODULE
// =====================================================

let salesGlobal = [];


// =====================================================
// BULAN
// =====================================================

const salesMonths = [

    {
        value: "1",
        name: "Januari"
    },

    {
        value: "2",
        name: "Februari"
    },

    {
        value: "3",
        name: "Maret"
    },

    {
        value: "4",
        name: "April"
    },

    {
        value: "5",
        name: "Mei"
    },

    {
        value: "6",
        name: "Juni"
    },

    {
        value: "7",
        name: "Juli"
    },

    {
        value: "8",
        name: "Agustus"
    },

    {
        value: "9",
        name: "September"
    },

    {
        value: "10",
        name: "Oktober"
    },

    {
        value: "11",
        name: "November"
    },

    {
        value: "12",
        name: "Desember"
    }

];


// =====================================================
// PILIH TAHUN
// =====================================================

function loadSalesMonths(){

    const year =
        document
        .getElementById("salesYear")
        .value;

    const monthBox =
        document
        .getElementById("salesMonthBox");

    const monthSelect =
        document
        .getElementById("salesMonth");

    if(!year){

        monthBox.style.display = "none";

        return;

    }

    monthSelect.innerHTML = `
        <option value="">
            Pilih Bulan
        </option>
    `;

    salesMonths.forEach(month=>{

        monthSelect.innerHTML += `

            <option value="${month.value}">
                ${month.name}
            </option>

        `;

    });

    monthBox.style.display = "block";

    document
        .getElementById("salesStoreBox")
        .style.display = "none";

    document
        .getElementById("salesSummary")
        .style.display = "none";

    document
        .getElementById("salesFilterBox")
        .style.display = "none";

    document
        .getElementById("salesTableBox")
        .style.display = "none";

}


// =====================================================
// LOAD STORE
// =====================================================

function loadSalesStores(){

    const year =
        document
        .getElementById("salesYear")
        .value;

    const month =
        document
        .getElementById("salesMonth")
        .value;

    const storeBox =
        document
        .getElementById("salesStoreBox");

    const storeSelect =
        document
        .getElementById("salesStore");

    if(!year || !month){

        storeBox.style.display = "none";

        return;

    }

    showLoading(
        "Loading Store..."
    );

    fetch(
        GAS_URL +
        "?action=getSalesStores" +
        "&year=" +
        encodeURIComponent(year) +
        "&month=" +
        encodeURIComponent(month)
    )

    .then(res=>res.json())

    .then(result=>{

        hideLoading();

        if(!result.success){

            showPopup(
                result.message ||
                "Gagal mengambil Store",
                "❌"
            );

            return;
        }

        storeSelect.innerHTML = `

            <option value="">
                Pilih Store
            </option>

        `;

        result.stores.forEach(store=>{

           storeSelect.innerHTML += `

    <option value="${store.code}">
        ${store.code}
    </option>

`;
        });

        storeBox.style.display = "block";

        document
            .getElementById("salesSummary")
            .style.display = "none";

        document
            .getElementById("salesFilterBox")
            .style.display = "none";

        document
            .getElementById("salesTableBox")
            .style.display = "none";

    })

    .catch(err=>{

        hideLoading();

        console.error(
            "SALES STORE ERROR:",
            err
        );

        showPopup(
            "Gagal koneksi ke server",
            "❌"
        );

    });

}


// =====================================================
// LOAD SALES DATA
// =====================================================

function loadSalesData(){

    const year =
        document
        .getElementById("salesYear")
        .value;

    const month =
        document
        .getElementById("salesMonth")
        .value;

    const store =
        document
        .getElementById("salesStore")
        .value;


    if(!year || !month || !store){

        return;

    }


    showLoading(
        "Loading Sales..."
    );


    fetch(
        GAS_URL +
        "?action=getSalesData" +
        "&year=" +
        encodeURIComponent(year) +
        "&month=" +
        encodeURIComponent(month) +
        "&store=" +
        encodeURIComponent(store)
    )


    .then(res => res.json())


    .then(result => {

        hideLoading();


        // =============================================
        // CEK RESPONSE
        // =============================================

        if(!result.success){

            showPopup(
                result.message ||
                "Data Sales tidak ditemukan",
                "❌"
            );

            return;

        }


        // =============================================
        // SIMPAN DATA
        // =============================================

        salesGlobal =
            result.data || [];


        // =============================================
        // TAMPILKAN SUMMARY
        // =============================================

        tampilkanSalesSummary(
            salesGlobal
        );


        // =============================================
        // TAMPILKAN TABLE
        // =============================================

        tampilkanSalesResult(
            salesGlobal
        );


        // =============================================
        // TAMPILKAN CHART
        // =============================================

        tampilkanSalesChart(
            salesGlobal
        );


        // =============================================
        // TAMPILKAN CONTAINER
        // =============================================

        document
            .getElementById("salesSummary")
            .style.display = "block";


        document
            .getElementById("salesFilterBox")
            .style.display = "block";


        document
            .getElementById("salesTableBox")
            .style.display = "block";


        document
            .getElementById("salesChartBox")
            .style.display = "block";


    })


    .catch(err => {

        hideLoading();


        console.error(
            "SALES DATA ERROR:",
            err
        );


        showPopup(
            "Gagal koneksi ke server",
            "❌"
        );

    });

}


// =====================================================
// FORMAT RUPIAH
// =====================================================

function formatRupiah(value){

    const number =
        Number(value) || 0;

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(number);

}


// =====================================================
// FORMAT ANGKA
// =====================================================

function formatNumber(value){

    return new Intl.NumberFormat(
        "id-ID",
        {
            maximumFractionDigits: 2
        }
    ).format(
        Number(value) || 0
    );

}


// =====================================================
// SUMMARY
// =====================================================

function tampilkanSalesSummary(data){

    let totalSales = 0;
    let totalTransaction = 0;

    data.forEach(row=>{

        totalSales +=
            Number(row.sales) || 0;

        totalTransaction +=
            Number(row.transaction) || 0;

    });


    /*
       UPT dan ATV dihitung dari
       total data periode.
    */

    const totalUPT =
        data.length
        ? data.reduce(
            (sum,row)=>
                sum +
                (
                    Number(row.upt) || 0
                ),
            0
        ) / data.length
        : 0;


    const ATV =
        totalTransaction > 0
        ? totalSales /
          totalTransaction
        : 0;


    document
        .getElementById("salesTotal")
        .innerHTML =
        formatRupiah(
            totalSales
        );


    document
        .getElementById("salesTransaction")
        .innerHTML =
        formatNumber(
            totalTransaction
        );


    document
        .getElementById("salesUPT")
        .innerHTML =
        formatNumber(
            totalUPT
        );


    document
        .getElementById("salesATV")
        .innerHTML =
        formatRupiah(
            ATV
        );

}


// =====================================================
// SALES TABLE
// =====================================================

function tampilkanSalesResult(data){

    let html = `

        <div style="overflow-x:auto">

        <table>

            <thead>

                <tr>

                    <th>Tanggal</th>

                    <th>Sales</th>

                    <th>Target</th>

                    <th>Transaksi</th>

                    <th>Traffic</th>

                    <th>Qty Sold</th>

                    <th>UPT</th>

                    <th>ATV</th>

                </tr>

            </thead>

            <tbody>

    `;


    if(data.length === 0){

        html += `

            <tr>

                <td
                    colspan="8"
                    style="text-align:center"
                >
                    Tidak ada data
                </td>

            </tr>

        `;

    }


    data.forEach(row=>{

        html += `

            <tr>

                <td>
                    ${row.date}
                </td>

                <td>
                    ${formatRupiah(
                        row.sales
                    )}
                </td>

                <td>
                    ${formatRupiah(
                        row.target
                    )}
                </td>

                <td>
                    ${formatNumber(
                        row.transaction
                    )}
                </td>

                <td>
                    ${formatNumber(
                        row.traffic
                    )}
                </td>

                <td>
                    ${formatNumber(
                        row.qtySold
                    )}
                </td>

                <td>
                    ${formatNumber(
                        row.upt
                    )}
                </td>

                <td>
                    ${formatRupiah(
                        row.atv
                    )}
                </td>

            </tr>

        `;

    });


    html += `

            </tbody>

        </table>

        </div>

    `;


    document
        .getElementById("salesResult")
        .innerHTML = html;

}
// =====================================================
// FILTER TANGGAL
// =====================================================

function filterSalesTable(){

    const from =
        document
        .getElementById("salesDateFrom")
        .value;

    const to =
        document
        .getElementById("salesDateTo")
        .value;

    let filtered =
        [...salesGlobal];

    // =============================================
    // FILTER DARI TANGGAL
    // =============================================

    if(from){

        filtered =
            filtered.filter(row => {

                return row.isoDate >= from;

            });

    }

    // =============================================
    // FILTER SAMPAI TANGGAL
    // =============================================

    if(to){

        filtered =
            filtered.filter(row => {

                return row.isoDate <= to;

            });

    }

    // =============================================
    // UPDATE SUMMARY
    // =============================================

    tampilkanSalesSummary(
        filtered
    );

    // =============================================
    // UPDATE TABLE
    // =============================================

    tampilkanSalesResult(
        filtered
    );

    // =============================================
    // UPDATE GRAPH
    // =============================================

    tampilkanSalesChart(
        filtered
    );

}


// =====================================================
// RESET SALES FILTER
// =====================================================

function resetSalesFilter(){

    document
        .getElementById("salesDateFrom")
        .value = "";

    document
        .getElementById("salesDateTo")
        .value = "";


    // kembali ke seluruh data bulan

    tampilkanSalesSummary(
        salesGlobal
    );


    tampilkanSalesResult(
        salesGlobal
    );


    tampilkanSalesChart(
        salesGlobal
    );

}
// =====================================================
// SALES CHART
// =====================================================

let salesChartInstance = null;
let salesTransactionChartInstance = null;


// =====================================================
// TAMPILKAN SALES CHART
// =====================================================

function tampilkanSalesChart(data){

    const chartBox =
        document
        .getElementById("salesChartBox");


    if(!chartBox){
        return;
    }


    if(!data || data.length === 0){

        chartBox.style.display =
            "none";

        return;

    }


    chartBox.style.display =
        "block";


    // =============================================
    // DATA
    // =============================================

    const labels =
        data.map(row =>
            row.date
        );


    const salesData =
        data.map(row =>
            Number(row.sales) || 0
        );


    const transactionData =
        data.map(row =>
            Number(row.transaction) || 0
        );


    // =============================================
    // SALES CHART
    // =============================================

    const salesCanvas =
        document
        .getElementById("salesChart");


    if(!salesCanvas){
        return;
    }


    // Hancurkan chart lama

    if(salesChartInstance){

        salesChartInstance.destroy();

    }


    salesChartInstance =
        new Chart(
            salesCanvas,
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Sales",

                            data:
                                salesData,

                            tension:
                                0.3,

                            fill:
                                false,

                            borderWidth:
                                2,

                            pointRadius:
                                4

                        }

                    ]

                },

                options: {

                    responsive:true,

                    maintainAspectRatio:false,

                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false

                    },

                    plugins: {

                        legend: {

                            display:
                                true

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(context){

                                        return (
                                            "Sales: " +
                                            formatRupiah(
                                                context.raw
                                            )
                                        );

                                    }

                            }

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                callback:
                                    function(value){

                                        return formatRupiah(
                                            value
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );


    // =============================================
    // TRANSACTION CHART
    // =============================================

    const transactionCanvas =
        document
        .getElementById(
            "salesTransactionChart"
        );


    if(!transactionCanvas){
        return;
    }


    if(
        salesTransactionChartInstance
    ){

        salesTransactionChartInstance
            .destroy();

    }


    salesTransactionChartInstance =
        new Chart(
            transactionCanvas,
            {

                type:
                    "bar",

                data: {

                    labels:
                        labels,

                    datasets: [

                        {

                            label:
                                "Transaksi",

                            data:
                                transactionData,

                            borderWidth:
                                1

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            display:
                                true

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            }

                        }

                    }

                }

            }

        );

}
