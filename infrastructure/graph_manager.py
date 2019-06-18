from io import StringIO
from datetime import datetime
import csv


class GraphManager:
    def __init__(self, string_data, start_datetime, end_datetime):
        self.string_data = string_data
        self.start_datetime = datetime.strptime(start_datetime, '%Y-%m-%d %H:%M:%S')
        self.end_datetime = datetime.strptime(end_datetime, '%Y-%m-%d %H:%M:%S')

    def get_data(self):
        nodes = self.__get_nodes()
        typed_nodes = self.__define_nodes_types(nodes.copy())
        transacted_nodes = self.__get_nodes_transactions(typed_nodes.copy())
        result_nodes = self.__build_nodes(transacted_nodes.copy())
        result_edges = self.__build_edges(transacted_nodes.copy())

        result = {
            'nodes': result_nodes,
            'edges': result_edges
        }

        return result

    def __build_edges(self, transacted_nodes):
        result = []

        for node in transacted_nodes:
            for transaction in node['to']:
                args = {
                    'source': node['title'].upper(),
                    'target': transaction['title'].upper()
                }
                result.append(args)

        return result

    def __build_nodes(self, transacted_nodes):
        result = []

        for node in transacted_nodes:
            if len(node['to']) == 0 and len(node['from']) == 0:
                continue
            args = {}
            args['id'] = node['title'].upper()
            args['label'] = node['title']
            args['type'] = node['type']
            amount = 0
            for transaction in node['to']:
                amount += int(transaction['amount'])
            for transaction in node['from']:
                amount += int(transaction['amount'])
            is_multiplied = False
            if len(node['to']) == 0 or len(node['from']) == 0:
                amount *= 2
                is_multiplied = True
            args['amount'] = amount
            turnover = amount
            if is_multiplied:
                turnover /= 2

            info = f'{node["title"]} ({node["type"]})\nОборот (получено + отправлено): {self.__get_readable_number(int(turnover))}\n\n====================\nОтправленные средства:\n'
            for i, transaction in enumerate(node['to']):
                info += f'{i + 1}) {transaction["title"]} ({self.__get_readable_number(transaction["amount"])}) ({transaction["datetime"]})\n'
            info += '\n====================\nПолученные средства:\n'
            for i, transaction in enumerate(node['from']):
                info += f'{i + 1}) {transaction["title"]} ({self.__get_readable_number(transaction["amount"])}) ({transaction["datetime"]})\n'

            args['info'] = info

            result.append(args)

        return result

    def __get_nodes_transactions(self, typed_nodes):
        csv_dict = csv.DictReader(StringIO(self.string_data))

        for row in csv_dict:
            transaction_datetime = datetime.strptime(row['datetime'], '%Y-%m-%d %H:%M:%S')
            if transaction_datetime < self.start_datetime or transaction_datetime > self.end_datetime:
                continue
            for node in typed_nodes:
                if row['from'] == node['title']:
                    args = {
                        'title': row['to'],
                        'amount': int(row['amount']),
                        'datetime': row['datetime']
                    }
                    node['to'].append(args)
                elif row['to'] == node['title']:
                    args = {
                        'title': row['from'],
                        'amount': int(row['amount']),
                        'datetime': row['datetime']
                    }
                    node['from'].append(args)

        return typed_nodes

    def __define_nodes_types(self, nodes):
        result = []

        csv_dict = csv.DictReader(StringIO(self.string_data))

        for row in csv_dict:
            if row['from'] in nodes:
                args = {
                    'title': row['from'],
                    'type': row['from_type'],
                    'to': [],
                    'from': []
                }
                result.append(args)
                nodes.remove(row['from'])
            elif row['to'] in nodes:
                args = {
                    'title': row['to'],
                    'type': row['to_type'],
                    'to': [],
                    'from': []
                }
                result.append(args)
                nodes.remove(row['to'])

        return result

    def __get_nodes(self):
        result = []

        csv_dict = csv.DictReader(StringIO(self.string_data))

        for row in csv_dict:
            result.append(row['from'])
            result.append(row['to'])

        return list(set(result))

    def __get_readable_number(self, value):
        value = str(int(value))
        result = ''
        for i, letter in enumerate(value[::-1]):
            if (i + 1) % 3 == 0:
                result = f'.{letter}' + result
            else:
                result = str(letter) + result
        if result[0] == '.':
            return result[1:]
        return result
