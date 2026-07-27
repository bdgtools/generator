// URL Google Apps Script
const GAS_URL = "https://script.google.com/macros/s/AKfycbzPkU1IngIVVAkdqyb4803fjwWj-xFblnUo2xSypsF1QWvZWh6fK8X_XZUYmMBdT1Xz/exec";


// ======================
// LOGIN
// ======================

function login(){

    const storeCode = document.getElementById("storeCode").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("loginMsg");


    if(storeCode === "" || password === ""){

        msg.innerHTML = "Store Code dan Password wajib diisi";
        return;

    }


    msg.innerHTML = "Checking...";


    fetch(
      GAS_URL +
      "?storeCode=" + encodeURIComponent(storeCode) +
      "&password=" + encodeURIComponent(password)
    )


    .then(response => response.json())


    .then(data => {


        if(data.success === true){


            // sembunyikan login

            document.getElementById("loginPage")
            .style.display="none";


            // tampilkan dashboard

            document.getElementById("dashboardPage")
            .style.display="block";


            document.getElementById("storeInfo").innerHTML =
            "Store : " + data.storeName +
            " (" + data.storeCode + ")";


            // simpan session

            localStorage.setItem(
                "storeCode",
                data.storeCode
            );


        }else{


            msg.innerHTML="Store Code / Password salah atau tidak aktif";


        }


    })


    .catch(error=>{

        console.log(error);

        msg.innerHTML="Gagal koneksi server";

    });


}


// ======================
// LOGOUT
// ======================

function logout(){


    localStorage.removeItem("loginStore");


    document.getElementById("dashboardPage").style.display="none";


    document.getElementById("loginPage").style.display="block";


    document.getElementById("storeCode").value="";

    document.getElementById("password").value="";


}



// ======================
// OPEN MODULE
// ======================

function openModule(module){


    // sembunyikan dashboard

    document.getElementById("dashboardPage")
    .style.display="none";


    // sembunyikan semua module

    document.getElementById("stockModule")
    .style.display="none";


    document.getElementById("salesModule")
    .style.display="none";


    document.getElementById("itemizeModule")
    .style.display="none";


    document.getElementById("reportModule")
    .style.display="none";



    // tampilkan module pilihan


    if(module==="stock"){


        document.getElementById("stockModule")
        .style.display="block";


    }


    if(module==="sales"){


        document.getElementById("salesModule")
        .style.display="block";


    }


    if(module==="itemize"){


        document.getElementById("itemizeModule")
        .style.display="block";


    }


    if(module==="report"){


        document.getElementById("reportModule")
        .style.display="block";


    }


}




// ======================
// BACK DASHBOARD
// ======================

function backDashboard(){


    document.getElementById("stockModule")
    .style.display="none";


    document.getElementById("salesModule")
    .style.display="none";


    document.getElementById("itemizeModule")
    .style.display="none";


    document.getElementById("reportModule")
    .style.display="none";


    document.getElementById("dashboardPage")
    .style.display="block";


}
