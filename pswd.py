import bcrypt
import subprocess
import sys

#wrds = subprocess.Popen(["xkcdpass", "-n 4"], stdout=subprocess.PIPE)
#pwdin = wrds.stdout.read() ends up being the binary result
# TODO learn more about difference

result = subprocess.run(['xkcdpass', '-n 4'], capture_output=True, text=True)

if result.stderr:
    print(result.stderr)
    sys.exit()

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(15)).decode('utf-8')

pwdin = result.stdout.strip()
print(pwdin)
pwd = ''.join(pwdin.split(' '))
print(pwd)
print(hash_password(pwd))
