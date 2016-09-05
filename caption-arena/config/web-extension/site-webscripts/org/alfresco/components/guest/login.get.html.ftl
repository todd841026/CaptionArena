<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/guest/login.css" group="login"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/guest/login.js" group="login"/>
</@>

<@markup id="widgets">
   <@createWidgets group="login"/>
</@>

<@markup id="html">
   <@uniqueIdDiv>
      <#assign el=args.htmlid?html>
      <div id="${el}-body" class="theme-overlay login hidden">
      
      <@markup id="header">
         <#assign aboutConfig=config.scoped["Edition"]["login"]>
         <div class="theme-company-logo ${aboutConfig.getChildValue("css-class")!logo-com}"></div>
      </@markup>
      
      
      
      <@markup id="form">
      	 <div class="caption-logo"></div>
      	 <#if errorDisplay == "container">
      <@markup id="error">
         <#if error>
	         <div class="error">${msg("message.loginautherror")}</div>
	         <#else>
	         <script type="text/javascript">//<![CDATA[
	            document.cookie = "_alfTest=_alfTest";
	            var cookieEnabled = (document.cookie.indexOf("_alfTest") !== -1);
	            if (!cookieEnabled)
	            {
	               document.write('<div class="error">${msg("message.cookieserror")}</div>');
	            }
	         //]]></script>
	         </#if>
      	 </@markup>
      	 </#if>
         <form id="${el}-form" accept-charset="UTF-8" method="post" action="${loginUrl}" class="form-fields login ${edition}">
            <@markup id="fields">
            <input type="hidden" id="${el}-success" name="success" value="${successUrl?replace("@","%40")?html}"/>
            <input type="hidden" name="failure" value="${failureUrl?replace("@","%40")?html}"/>
            <div class="form-field">
               <label for="${el}-username"></label>
               <input type="text" id="${el}-username" name="username" maxlength="255" placeholder="请输入用户名" value="" autocomplete="off"/>
            </div>
            <div class="form-field">
               <label for="${el}-password"></label>
               <input type="password" id="${el}-password" name="password" maxlength="255" placeholder="请输入密码" value="" autocomplete="off"/>
            </div>
            </@markup>
            <@markup id="buttons">
            <div class="form-field">
               <input type="button" id="${el}-registered" class="registered-button" value="${msg("button.registered")}"/>
            </div>
            <div class="form-field">
               <input type="submit" id="${el}-submit" class="login-button" value="${msg("button.login")}"/>
            </div>
            </@markup>
         </form>
      </@markup>
      
      <@markup id="preloader">
         <script type="text/javascript">//<![CDATA[
            window.onload = function() 
            {
                setTimeout(function()
                {
                    var xhr;
                    <#list dependencies as dependency>
                       xhr = new XMLHttpRequest();
                       xhr.open('GET', '<@checksumResource src="${url.context}/res/${dependency}"/>');
                       xhr.send('');
                    </#list>
                    <#list images as image>
                       new Image().src = "${url.context?js_string}/res/${image}";
                    </#list>
                }, 1000);
            };
         //]]></script>
      </@markup>

      </div>
   </@>
</@>