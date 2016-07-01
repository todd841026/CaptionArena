
<@markup id="html">
   <@uniqueIdDiv>
		<div class="container">
			<ol class="breadcrumb">
				<li><a href="#">返回</a></li>
	            <li class="active">Mad Max</li>
			</ol>
				<input type="hidden" value=${nodeId} id = "in2"/>
				<input type="hidden" value=${srtId} id = "in3"/>
			 <div id="video-player">
					<div class="video-background"></div>
					<div class="text-background"></div>
			</div>
			<div class="">
					<div class="adjust">
						<button class="lbtn" id="lbtn" onclick="lefttime()"></button>
						<span class="time"></span>
						<button class="rbtn" onclick="righttime()"></button>
				</div>
				<div class="editarena">
						<input class="editInput"  type="text" id="editInputCa" placeholder="请点击此处编辑字幕"  id="time2" />
						<button class="btn btn-default" id="btn_madeCa" onclick="madeCa()">确定</button>
				</div>
				<div class="center" >
					<button class="btn btn-default submit">提交</button>
					<p>注: 点击“提交”按钮后，您之前所有“确定”过的字幕都将一并提交。</p>
				</div>
		</div>
   </@>
</@>

