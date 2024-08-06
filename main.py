import webview

class js2py():
    def returnText(self):
        pass
    
def getcws_now():
    pass

def creatWindow():
    mainWindow = webview.create_window('Capacity Checking', './www/index.html', width=650, height=650, resizable=False)

def testStart():
    print('testStart DONE')

if __name__ == '__main__':
	creatWindow()
	webview.start()