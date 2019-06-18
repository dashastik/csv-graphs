# import csv
# from io import StringIO

# @app.route('/', methods=['GET', 'POST'])
# def index():
#     if request.method == 'POST':
#         user_file = request.files['user_file']
#         reader = csv.DictReader(StringIO(user_file.read().decode()))
#         for row in reader:
#             print(row)
#         session['user_file'] = user_file.read().decode()
#         return redirect('/')
#     return render_template('index.html')
from flask import Flask, render_template, request, redirect, url_for, session

from infrastructure import GraphManager


app = Flask(__name__)
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'


@app.route('/')
def index():
    args = {'title': 'Main Page'}
    return render_template('index.html')


@app.route('/load_file', methods=['GET', 'POST'])
def load_file():
    if request.method == 'GET':
        return redirect(url_for('index'))
    user_file = request.files['user_file']
    session['user_file'] = user_file.read().decode()
    return redirect(url_for('view_graph'))


@app.route('/view_graph')
def view_graph():
    try:
        data = session['user_file']
        start_datetime = request.args.get('from_datetime', '1970-01-01 00:00:00')
        end_datetime = request.args.get('to_datetime', '3000-01-01 00:00:00')
        graph_manager = GraphManager(data, start_datetime, end_datetime)
        args = {'title': 'My Graph', 'dataset': graph_manager.get_data()}
        return render_template('graph.html', **args)
    except KeyError:
        return redirect(url_for('index'))


@app.route('/delete_graph')
def delete_graph():
    session.pop('user_file', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
