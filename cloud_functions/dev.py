import logging
import sys
import yaml
import os
IS_DEV = False
if __name__ == '__main__':
    IS_DEV = True


if IS_DEV:
    with open("env.yaml") as env:
        data = yaml.load(env, Loader=yaml.FullLoader)
        for key, value in data.items():
            os.environ[key] = value 

    import app
    from app.functions.generate_video_configs import *
    from app.functions.generate_product_configs import *
    from app.functions.generate_video_targeting import *
    app.init(debug=IS_DEV)

    
    from flask import Flask, request
    app = Flask(__name__)
    '''
    @app.route('/', methods=['POST', 'GET'])
    def test():
        return test_message(request)
    '''
    functions = [
        'generate_video_configs',
        'generate_product_configs',
        'generate_video_targeting',
        ]
    
    for function in functions:
        app.add_url_rule(f'/{function}', function, locals()[function], methods=['POST', 'GET'], defaults={'request': request})
    app.run(host='127.0.0.1', port=8088)