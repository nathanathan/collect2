from django.http import HttpResponse
from django.shortcuts import render_to_response
from django import forms

import datetime
import tempfile
import os

import xlsform2
from zipfile import ZipFile

SERVER_TMP_DIR = '/tmp'

class UploadFileForm(forms.Form):
    file  = forms.FileField()

#def handle_uploaded_file(f, temp_dir):
#    xls_path = os.path.join(temp_dir, f.name)
#    destination = open(xls_path, 'wb+')
#    for chunk in f.chunks():
#        destination.write(chunk)
#    destination.close()
#    return xls_path

def index(request):
    if request.method == 'POST':
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            error = None
            warnings = None
            
            filename, ext = os.path.splitext(request.FILES['file'].name)
            
            #Make a randomly generated directory to prevent name collisions
            temp_dir = tempfile.mkdtemp(dir=SERVER_TMP_DIR)
            output_filename = 'formDef.json' #filename + '.json'
            out_path = os.path.join(temp_dir, output_filename)
            #Init the output xml file.
            fo = open(out_path, "wb+")
            fo.close()
            
            try:
                warnings = []
                xlsform2.spreadsheet_to_json(request.FILES['file'], out_path)
                
            except Exception as e:
                error = 'Error: ' + str(e)
            
            return render_to_response('xlsform2/upload.html', {
                'form': form,#UploadFileForm(),#Create a new empty form
                'dir': os.path.split(temp_dir)[-1],
                'name' : output_filename,
                'error': error,
                'warnings': warnings,
            })
        else:
            #Fall through and use the invalid form
            pass
    else:
        form = UploadFileForm() #Create a new empty form
        
    return render_to_response('upload.html', {
        'form': form,
    })
    
def download(request, path):
    """
    Serve a downloadable file
    """
    fo = open(os.path.join(SERVER_TMP_DIR, path))
    data = fo.read()
    fo.close()
    response = HttpResponse(mimetype='application/octet-stream')
    response.write(data)
    return response

#def download_zip(request):
#
#    try:
#        myzip = ZipFile('test.zip', 'w')
#        myzip.write(output_path, os.path.basename(output_path))
#    except: 
#        pass
#    finally:
#        myzip.close()

def preview(request, dir, name):
    """
    Serve the file as a webpage
    """
    fo = open(os.path.join(SERVER_TMP_DIR, dir, name))
    data = fo.read()
    fo.close()
    response = HttpResponse()
    response.write("Sorry, form previewing is currently broken")
    return response