var KMapp = {};

// endpoint qie devuelve las preguntas de tipo /api/v1/questions/
KMapp.questionsEndPoint = 'http://localhost:8080/JsonFile/fichero.json';

KMapp.tags = new Array();

KMapp.innerTag = "";

KMapp.init = function(tag) {
	//reseteamos valores
	KMapp.tags = new Array();
	if(tag != null && (typeof tag === 'string')){
		console.log("tag no vacio: "+tag);
		KMapp.innerTag = tag;
	}else{
		console.log("tag vacio");
		KMapp.innerTag = "";
	}
	
    // contenedor de preguntas
    var questionsList = document.querySelector('#mainbar');
    
    // enlace para refrescar los resultados, volver a obtener las preguntas
    var refresh = document.querySelector('a.refresh');
    
    var bustCache = '?' + new Date().getTime() + '&callback=?';
    var oReq = new XMLHttpRequest();
    
    // rotamos la imagen mientras se obtienen los datos
    refresh.classList.toggle('rotate');
    
    oReq.open('GET', KMapp.questionsEndPoint + bustCache, true);
    oReq.responseType = 'json';
    oReq.send();
    oReq.onload = function(e) {
        var xhr = e.target;
        
        // comprueba que recibimos los datos con el tipo esperado.
        if (xhr.responseType === 'json') {
            
            // comprueba que existe alguna pregunta
            if (xhr.response.count > 0) {
                
                // limpia el contenedor
                questionsList.innerHTML = '';
                
                // convierte el array de preguntas en un conjunto de li
                questionsList.innerHTML += xhr.response.questions.map(KMapp.buildQuestion).join('');
                
                //vamos a imprimir los tags mas famosos
                document.querySelector('#tagsbar').innerHTML = createPopularTags();
                                
                // establece el evento click de cada pregunta. Efecto acordeón
                KMapp.attachAccordionEvent();
                
                //anyade la funcion de busqueda por tag
                KMapp.findTag();
            }
        } else {
            // algo fue mal, fin de la ejecución.
            console.log(xhr.responseText);                          
            questionsList.innerHTML = JSON.parse(xhr.responseText).message;
        }
    };
    
    // para la rotación de la imagen
    refresh.classList.toggle('rotate');
}


// Añade o quita las clases "active" y "show" para dar efecto acordeón.
// Active se usa para diferenciar la pregunta seleccionada
// Show se usa para abrir el texto de la pregunta

KMapp.attachAccordionEvent = function() {
    var acc = document.querySelectorAll('.accordion');
    var i;
    for (i = 0; i < acc.length; i++) {
        acc[i].onclick = function() {
            this.classList.toggle('active');
            this.querySelector('div.panel').classList.toggle('show');
        }
    }
}

KMapp.findTag = function(){
	var aFindTag = document.querySelectorAll('a.findTag');
    var i;
    console.log('vamos a iterar');
    for (i = 0; i < aFindTag.length; i++) {
    	aFindTag[i].onclick=function(){
    		console.log("this.title: "+this.title);
    		KMapp.init(this.title);
    	}
    }
}

KMapp.buildQuestion = function(item, index) {
    var current= new Date();
    var qDate = new Date(item.added_at*1000);
    var tags = item.tags.map(KMapp.buildTag).join('');
    item.tags.map(sumTaggs);
    if(KMapp.innerTag == undefined || tags.indexOf(KMapp.innerTag) > -1){
    	return `
        <div class="question-summary narrow">
            <div class="cp">
                <div class="votes">
                    <div class="mini-counts"><span title="0 votos">0</span></div>
                    <div>votos</div>
                </div>
                <div class="status@unanswered">
                    <div class="mini-counts"><span title="@answer_count answers">@answer_count</span></div>
                    <div>respuestas</div>
                </div>
                <div class="views">
                    <div class="mini-counts"><span title="@view_count vistas">@view_count</span></div>
                    <div>vistas</div>
                </div>
            </div>
            <div class="summary accordion">
                <h3><a href="@url" class="question-hyperlink" title="@title">@title</a></h3>
                <div class="tags">
                    @tags
                </div>
                <div class="started">
                    <a href="" class="started-link">preguntado <span title="@added_at" class="relativetime">@relativetime por </span></a>
                    <a href="">@author</a><span class="reputation-score" title="reputation score " dir="ltr"> @score</span>
                </div>
                <div class="panel">
                    @summary
                    <div class="url"><a href="@url" title="Ver en KM">Ver en KM</a></div>
                </div>
            </div>
        </div>`
        .replace('@unanswered', item.answer_count == 0 ? ' unanswered' : item.accepted_answer_id != null ? ' answered-accepted' : ' answered')
        .split('@answer_count').join(item.answer_count)
        .split('@view_count').join(item.view_count)
        .split('@title').join(item.title)
        .replace('@author', item.author.username)
        .replace('@added_at', qDate.toLocaleString())
        .replace('@relativetime', timeDifference(current, qDate))
        .replace('@score', item.score)
        .replace('@tags', tags)
        .replace('@summary', item.summary)
        .replace('@url', item.url);
    }else{
    	return '';
    }
}

KMapp.buildTag = function(item, index) {
    return `
        <a href="" class="post-tag t-@tag" title="show questions tagged '@tag'" rel="tag">@tag</a>
    `
    .split('@tag').join(item);
}

function sumTaggs(item, index) {
	var encontrado = false;
	for (var i=0; i < KMapp.tags.length && !encontrado; i++) {
        if (KMapp.tags[i].tagName === item) {
        	KMapp.tags[i].tagCount = KMapp.tags[i].tagCount+1;
        	encontrado = true;
        }
    }
	if(!encontrado){
		KMapp.tags.push({tagName: item, tagCount: 1});
	}
	
}

function createPopularTags(){
	
	KMapp.tags.sort(function(a, b) {
	    return b.tagCount - a.tagCount;
	});
	
	var cadena = "<div class='tags'>Popular Tags: ";
	for(var i=0; i < KMapp.tags.length && i < 5; i++){
		cadena += "<a href=\"#\" class=\"post-tag t-fenix findTag\" title=\""+KMapp.tags[i].tagName+"\" ";
		cadena += "rel=\"tag\">"+KMapp.tags[i].tagName + "("+KMapp.tags[i].tagCount+")"+"</a>";
	}
	cadena+="</div>";
	return cadena;
}

function timeDifference(current, previous) {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;
    var elapsed = current - previous;
    
    if (elapsed < msPerMinute) {
         return 'hace ' + Math.round(elapsed/1000) + ' segundos';   
    }else if (elapsed < msPerHour) {
         return 'hace ' + Math.round(elapsed/msPerMinute) + ' minutos';   
    }else if (elapsed < msPerDay ) {
         return 'hace ' + Math.round(elapsed/msPerHour ) + ' horas';   
    }else if (elapsed < msPerMonth) {
         return 'hace ' + Math.round(elapsed/msPerDay) + ' días';   
    }else if (elapsed < msPerYear) {
         return 'hace ' + Math.round(elapsed/msPerMonth) + ' meses';   
    }else {
         return 'hace ' + Math.round(elapsed/msPerYear ) + ' años';   
    }
}

// lanza la aplicación
KMapp.init();

document.querySelector('a.refresh').onclick = KMapp.init;

