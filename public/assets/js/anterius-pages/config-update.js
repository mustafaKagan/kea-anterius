/*
© Anthrino > DHCP config update handler
*/

$('#dhcp_config').height($(window).height() * 0.6);

var dhcp_config = ace.edit("dhcp_config");
dhcp_config.setTheme("ace/theme/terminal");
dhcp_config.$blockScrolling = Infinity;

var Range = ace.require('ace/range').Range;

function gen_dhcp_config(nw_id, nw_type, subnet_list) {

	/* Fetch config form options as query string */
	// dhcp_config_form_data = get_form_query_string("dhcp_config_form");
	// dhcp_config_form_data += "&nw_entity=" + nw_entity + "&nw_type=" + nw_type;

	configformData = $("#config-form").serializeArray();
	// console.log(configformData)

	/* Instantiate a temp test file */
	test_config_file = JSON.parse(dhcp_config.getValue());
	// console.log(test_config_file['Dhcp4']['subnet4'][0]);

	change_log = [];

	/* remove explicitly added property */
	// delete host_res[i]['subnet-id'];

	if (nw_type == 'reservations') {

		hr_addr = nw_id.split(':')[0];
		subnet_id = nw_id.split(':')[1];

		target_sn_list = [];

		/* Check if subnet lies under shared nw */
		if (subnet_list[subnet_id - 1].shared_nw_name)
			test_config_file['Dhcp4']['shared-networks'].forEach(shnw => {
				if (shnw.name == subnet_list[subnet_id - 1].shared_nw_name)
					target_sn_list = shnw.subnet4;
			});
		else
			target_sn_list = test_config_file['Dhcp4']['subnet4'];

		target_sn_list.forEach(s => {
			if (s.id == subnet_id) {
				s['reservations'].forEach(h => {
					if (h['ip-address'] == hr_addr)
						configformData.forEach(fd => {
							if (fd.value != 'undefined') {
								if (fd.name.includes('_')) {
									tags = fd.name.split('_');
									if (h[tags[0]][tags[1]] != fd.value) {
										h[tags[0]][tags[1]] = fd.value;
										change_log.push('"' + tags[1] + '": "' + fd.value + '"');
									}
								}
								else
									if (h[fd.name] != fd.value) {
										h[fd.name] = fd.value;
										change_log.push('"' + fd.name + '": "' + fd.value + '"');
									}
							}
						});
				});
				// TODO: make effecient
				// break;
				console.log(s);
			}
		});
	} else {
		if (nw_type == 'shared-networks')
			x = 'name';
		else
			x = 'id';
		test_config_file['Dhcp4'][nw_type].forEach(s => {
			if (s[x] == nw_id) {
				configformData.forEach(fd => {
					if (fd.value != 'undefined') {
						if (fd.name.includes('_')) {
							tags = fd.name.split('_');
							if (s[tags[0]][tags[1]] != fd.value) {
								s[tags[0]][tags[1]] = fd.value;
								change_log.push('"' + tags[1] + '": "' + fd.value + '"');
							}
						}
						else
							if (s[fd.name] != fd.value) {
								s[fd.name] = fd.value;
								change_log.push('"' + fd.name + '": "' + fd.value + '"');
							}
					}
				});
				// TODO: make effecient
				// break;
				// console.log(s)
			}
		});
	}

	// console.log(change_log);

	/* Set test config to editor and highlight changed lines */
	dhcp_config.setValue(JSON.stringify(test_config_file, null, 4), -1);
	change_log.forEach(param => {
		findEditedLineNumbers(dhcp_config, param);
	})


	notification('Test config_file generated.');
	notification('Switch to config file editor to review changes(highlighted)!');

	document.getElementById('test_btn').disabled = false;
	// $.post("/dhcp_config_update", dhcp_config_form_data, function (data) {
	// 	$("#dhcp_config_result").html(data);
	// });
}

function test_dhcp_config() {
	// Fetch changed config file data as query string for verification
	params = "mode=test&dhcp_config_file=" + encodeURIComponent(dhcp_config.getValue());

	$.post("/dhcp_config_update", params, function (data) {
		console.log(data.message);
		notification(data.message, 'bg-black', 10000);
	});
}

function save_dhcp_config() {
	// Push updated config file data as query string to server 
	params = "mode=update&dhcp_config_file=" + encodeURIComponent(dhcp_config.getValue());

	$.post("/dhcp_config_update", dhcp_config_form_data, function (data) {
		$("#dhcp_config_result").html(data);
	});
}
