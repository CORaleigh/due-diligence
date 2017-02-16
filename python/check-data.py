import urllib, json, sys, datetime
def getFeatures ():
	url = "http://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Due_Diligence/FeatureServer/0/query"
	params = urllib.urlencode({"f": "json", "where": "Status <> 1", "outFields" : "*"})
	headers = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
	response = urllib.urlopen(url, params)
	return response.read()
def setAreasComplete(oid, config):
	url = "http://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Due_Diligence_Areas/FeatureServer/0/query"
	params = urllib.urlencode({"f": "json", "where": "ID = " + str(oid), "outFields" : "OBJECTID", "returnGeometry": False})
	response = urllib.urlopen(url, params)
	features = json.loads(response.read())['features']
	if len(features) == 1:
		areaOid = features[0]['attributes']['OBJECTID']
		url = "http://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Due_Diligence_Areas/FeatureServer/0/updateFeatures"
		config["features"][0]['attributes']['OBJECTID'] = areaOid
		params = urllib.urlencode(config)
		headers = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
		response = urllib.urlopen(url, params)
		print response.read()
def setComplete (oid, all, planningAnswered, forestryAnswered, utilitiesAnswered, transAnswered, stormAnswered):
	url = "http://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Due_Diligence/FeatureServer/0/updateFeatures"
	config = {"features": [{"attributes": {"OBJECTID": oid}}], "f": "json"}
	if attributes["planningStatus"] != planningAnswered:
		config["features"][0]['attributes']['planningStatus'] = planningAnswered
	if attributes["planningStatus"] != planningAnswered:
		config["features"][0]['attributes']['planningStatus'] = planningAnswered
	if attributes["planningStatus"] != planningAnswered:
		config["features"][0]['attributes']['planningStatus'] = planningAnswered
	if attributes["planningStatus"] != planningAnswered:
		config["features"][0]['attributes']['planningStatus'] = planningAnswered
	if attributes["planningStatus"] != planningAnswered:
		config["features"][0]['attributes']['planningStatus'] = planningAnswered
	if attributes["Status"] != all:
		config["features"][0]['attributes']['Status'] = all										
	#params = urllib.urlencode({"features": [{"attributes": {"OBJECTID": oid, "Status": all, "planningStatus": planningAnswered, "forestryStatus": forestryAnswered, "utilitiesStatus": utilitiesAnswered, "transStatus": transAnswered, "stormStatus": stormAnswered}}], "f": "json"})
	params = urllib.urlencode(config)
	headers = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
	response = urllib.urlopen(url, params)
	print response.read()
	setAreasComplete(oid, config)	
def checkFeatures (features):
	for feature in features:
		attributes = feature['attributes']
		answered = 1
		planningAnswered = 1
		forestryAnswered = 1
		utilitiesAnswered = 1
		transAnswered = 1
		stormAnswered = 1
		#for attribute in attributes:
		#planning
		if attributes['planning1'] is None or attributes['planning2'] is None or attributes['planning3'] is None or attributes['planning4'] is None or attributes['planning5'] is None:
			planningAnswered = 0
			answered = 0
		#forestry
		if attributes['forestry1'] is None:
			forestryAnswered = 0
			answered = 0
		else:
			if attributes['forestry1'] == 1:
				if attributes['forestry2'] is None or attributes['forestry3'] is None:
					forestryAnswered = 0
					answered = 0
					print "forestry1"
		if attributes['forestry4'] is None or attributes['forestry5'] is None or attributes['forestry6'] is None:
			forestryAnswered = 0
			answered = 0
			print "forestry2"

		#public utility
		if attributes['utilities1'] is None or attributes['utilities2'] is None or attributes['utilities3'] is None or attributes['utilities4'] is None or attributes['utilities5'] is None:
			utilitiesAnswered = 0
			answered = 0
		#transportation
		if attributes['trans1'] is None or attributes['trans4'] is None:
			transAnswered = 0
			answered = 0
		if attributes['trans2_1a'] is None or attributes['trans2_1b'] is None or attributes['trans2_1c'] is None:
			transAnswered = 0
			answered = 0
		elif attributes['trans2_2a'] is not None and (attributes['trans2_2b'] is None or attributes['trans2_2c'] is None):
			transAnswered = 0
			answered = 0
		elif attributes['trans2_3a'] is not None and (attributes['trans2_3b'] is None or attributes['trans2_3c'] is None):
			transAnswered = 0
			answered = 0
		elif attributes['trans2_4a'] is not None and (attributes['trans2_4b'] is None or attributes['trans2_4c'] is None):
			transAnswered = 0
			answered = 0
		if attributes['trans3a'] is None:
			transAnswered = 0
			answered = 0
		elif attributes['trans3a'] == 0 and attributes['trans3b'] is None:
			transAnswered = 0
			answered = 0
		if attributes['trans5a'] is None:
			transAnswered = 0
			answered = 0
		elif attributes['trans5a'] == 0 and attributes['trans5b'] is None:
			transAnswered = 0
			answered = 0
		#stormwater
		if attributes['storm4'] is None or attributes['storm6'] is None or attributes['storm8'] is None or attributes['storm9'] is None or attributes['storm11'] is None or attributes['storm13'] is None:
			stormAnswered = 0
			answered = 0
		if attributes['storm5a'] is None:
			stormAnswered = 0
			answered = 0
		elif attributes['storm5a'] == 0 and attributes['storm5b'] is None:
			stormAnswered = 0
			answered = 0
		if attributes['storm7a'] is None:
			stormAnswered = 0
			answered = 0
		elif attributes['storm7a'] == 0 and attributes['storm7b'] is None:
			stormAnswered = 0
			answered = 0
		elif attributes['storm7b'] == 4 and attributes['storm7c'] is None:
			stormAnswered = 0
			answered = 0
		if attributes['storm10a'] is None:
			stormAnswered = 0
			answered = 0
		elif attributes['storm10a'] == 0 and attributes['storm10b'] is None:
			stormAnswered = 0
			answered = 0
		#if answered or planningAnswered or forestryAnswered or utilitiesAnswered or transAnswered or stormAnswered:
		setComplete(attributes['OBJECTID'], answered, planningAnswered, forestryAnswered, utilitiesAnswered, transAnswered, stormAnswered, attributes)
		#print attributes['OBJECTID']
		#print answered
data = getFeatures()
checkFeatures(json.loads(data)['features'])
