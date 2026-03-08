import sys
print("sys.argv:", sys.argv)
print("'test' in sys.argv:", 'test' in sys.argv)
print("Any arg contains 'test':", any('test' in arg for arg in sys.argv))
